#!/usr/bin/env node
/**
 * Prove the committed archive is the bytes that were minted.
 *
 * Zora Media V1 stores sha256(content) and sha256(metadata) on chain at mint time, so
 * "is this the real artwork?" is a hash comparison rather than a matter of trusting
 * whichever IPFS gateway answered. That is what makes this archive verifiable
 * independently of the people who made it — and it is strictly stronger than deriving
 * a digest from the CID, which only works for raw-codec (`bafkrei…`) CIDs and cannot
 * verify the dag-pb (`bafybei…`) CIDs this collection uses.
 *
 *   node scripts/snapshot/verify.js            offline: files vs. the snapshot
 *   node scripts/snapshot/verify.js --chain    also re-read the hashes from chain
 */

const fs = require('fs')
const path = require('path')
const { CONTRACT, RPC, TOKEN_IDS, paths } = require('./config')
const { SELECTORS, encodeCall, decodeBytes32, decodeAddress } = require('./abi')
const { createPool, batch } = require('./rpc')
const { sha256 } = require('./metadata')

const strip = (h) => (h ? String(h).replace(/^0x/, '').toLowerCase() : null)

function loadSnapshot() {
  const file = path.join(process.cwd(), paths.snapshot)
  if (!fs.existsSync(file)) {
    console.error(`no ${paths.snapshot} — run \`yarn snapshot\` first`)
    process.exit(2)
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

/** Every committed file, paired with the digest the snapshot claims for it. */
function refsOf(tokens) {
  const refs = []
  for (const t of tokens) {
    if (t.content && t.content.localPath) {
      refs.push({
        tokenId: t.tokenId,
        kind: 'content',
        localPath: t.content.localPath,
        expected: strip(t.content.sha256),
        bytes: t.content.bytes,
      })
    }
    if (t.metadataRef && t.metadataRef.localPath) {
      refs.push({
        tokenId: t.tokenId,
        kind: 'metadata',
        localPath: t.metadataRef.localPath,
        expected: strip(t.metadataRef.sha256),
        bytes: t.metadataRef.bytes,
      })
    }
  }
  return refs
}

function verifyOffline(refs) {
  const failures = []
  for (const ref of refs) {
    // localPath is a public URL path ("/media/3366/image.png"); resolve it under public/.
    const file = path.join(process.cwd(), 'public', ref.localPath.replace(/^\//, ''))
    if (!fs.existsSync(file)) {
      failures.push(`${ref.tokenId} ${ref.kind}: missing ${ref.localPath}`)
      continue
    }
    const buffer = fs.readFileSync(file)
    const digest = sha256(buffer)
    if (!ref.expected) {
      failures.push(`${ref.tokenId} ${ref.kind}: snapshot records no on-chain hash to check against`)
      continue
    }
    if (digest !== ref.expected) {
      failures.push(`${ref.tokenId} ${ref.kind}: sha256 ${digest} != on-chain ${ref.expected}`)
      continue
    }
    if (ref.bytes != null && buffer.length !== ref.bytes) {
      failures.push(`${ref.tokenId} ${ref.kind}: ${buffer.length} bytes on disk, snapshot says ${ref.bytes}`)
    }
  }
  return failures
}

/** Re-read the hashes, creators and owners from chain and diff against the snapshot. */
async function verifyAgainstChain(tokens) {
  const pool = createPool(RPC.batch)
  const fields = [
    ['contentHash', SELECTORS.tokenContentHashes, decodeBytes32],
    ['metadataHash', SELECTORS.tokenMetadataHashes, decodeBytes32],
    ['creator', SELECTORS.tokenCreators, decodeAddress],
    ['owner', SELECTORS.ownerOf, decodeAddress],
  ]

  const requests = []
  for (const tokenId of TOKEN_IDS) {
    for (const [, selector] of fields) {
      requests.push({
        method: 'eth_call',
        params: [{ to: CONTRACT, data: encodeCall(selector, tokenId) }, 'latest'],
      })
    }
  }

  const results = await batch(pool, requests)
  const failures = []
  const notes = []
  let cursor = 0

  for (const tokenId of TOKEN_IDS) {
    const chain = {}
    for (const [key, , decode] of fields) {
      const r = results[cursor++]
      if (r.error) throw new Error(`token ${tokenId} ${key}: ${JSON.stringify(r.error)}`)
      chain[key] = decode(r.result)
    }
    const token = tokens.find((t) => t.tokenId === tokenId)
    if (!token) {
      failures.push(`token ${tokenId} is on chain but not in the snapshot`)
      continue
    }
    if (strip(token.content && token.content.sha256) !== chain.contentHash) {
      failures.push(`token ${tokenId}: content hash drifted from chain`)
    }
    if (strip(token.metadataRef && token.metadataRef.sha256) !== chain.metadataHash) {
      failures.push(`token ${tokenId}: metadata hash drifted from chain`)
    }
    if (token.creator !== chain.creator) {
      failures.push(`token ${tokenId}: creator ${token.creator} != chain ${chain.creator}`)
    }
    // Expected to drift: these are tradeable, and the snapshot is an as-of record.
    if (token.owner !== chain.owner) {
      notes.push(`token ${tokenId}: owner is now ${chain.owner}, snapshot has ${token.owner}`)
    }
  }
  return { failures, notes }
}

async function main() {
  const useChain = process.argv.includes('--chain')
  const { meta, tokens } = loadSnapshot()
  const refs = refsOf(tokens)

  if (!refs.length) {
    console.error('no committed media referenced by the snapshot — run `yarn snapshot:media` first')
    process.exit(2)
  }

  const failures = verifyOffline(refs)
  console.log(`${refs.length - failures.length}/${refs.length} committed files match their on-chain sha256`)

  if (useChain) {
    const chain = await verifyAgainstChain(tokens)
    failures.push(...chain.failures)
    console.log(`chain re-read: ${chain.failures.length} mismatch(es), ${chain.notes.length} expected difference(s)`)
    for (const n of chain.notes) console.log(`  · ${n} (as of block ${meta.toBlock})`)
  }

  if (failures.length) {
    console.error(`\n${failures.length} failure(s):`)
    for (const f of failures) console.error(`  - ${f}`)
    process.exit(1)
  }
  console.log('OK')
}

main().catch((e) => {
  console.error(e && e.stack ? e.stack : e)
  process.exit(1)
})
