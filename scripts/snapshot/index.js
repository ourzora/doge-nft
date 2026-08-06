#!/usr/bin/env node
// Builds snapshot/mainnet.json — the single source of truth for the archived site.
// Everything the pages need (tokens, owners, metadata, media pointers, settled
// auction results) is derived here, once, offline, so the site itself makes zero
// network calls at build or runtime.
//
//   node scripts/snapshot/index.js                  full rebuild
//   node scripts/snapshot/index.js --only 3366      rebuild one token, merge into the file
//   node scripts/snapshot/index.js --verify         re-derive and diff, write nothing

const fs = require('fs')
const path = require('path')
const {
  NETWORK_ID,
  CONTRACT,
  AUCTION_HOUSE,
  DEFAULT_FROM_BLOCK,
  REORG_MARGIN,
  TOKEN_IDS,
  TOKEN_SLUGS,
  SITE_URL,
  RPC,
  GATEWAYS,
  CANONICAL_GATEWAY,
  paths,
} = require('./config')
const { createPool, call, sleep, fetchBlockTimestamps } = require('./rpc')
const { scanTransfers, fetchTokenData, fetchContractInfo } = require('./tokens')
const { scanAuctionLogs, buildSales, isoZ, dateTimeLabel } = require('./auctions')
const { cidFromUri, toCanonicalUrl, fetchVerified, probeIpfs, readOverride, sha256 } = require('./metadata')

function parseArgs(argv) {
  const args = { only: null, toBlock: null, skipMetadata: false, verify: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--only') args.only = argv[++i].split(',').map((s) => s.trim())
    else if (a === '--to-block') args.toBlock = Number(argv[++i])
    else if (a === '--skip-metadata') args.skipMetadata = true
    else if (a === '--verify') args.verify = true
    else throw new Error(`unknown flag: ${a}`)
  }
  return args
}

const log = (msg) => console.log(msg)
const warn = (list, msg) => {
  console.warn(`  ! ${msg}`)
  list.push(msg)
}

function readExisting(file) {
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (e) {
    return null
  }
}

const slugFor = (tokenId) => {
  const entry = TOKEN_SLUGS.find((t) => t.tokenId === tokenId)
  if (!entry) throw new Error(`no slug configured for token ${tokenId}`)
  return entry.slug
}

/**
 * Resolve one content-addressed reference: fetch it, prove it against the sha256 the
 * contract recorded at mint, and describe where it came from.
 */
async function resolveRef(tokenId, kind, uri, expectedHash, warnings) {
  const cid = cidFromUri(uri)
  const base = {
    uri: uri || null,
    cid,
    // Provenance only. Nothing at runtime resolves these — the bytes are committed
    // under public/media — but they record where the archive came from.
    sha256: expectedHash ? `0x${expectedHash}` : null,
    gatewayUrl: toCanonicalUrl(uri),
  }

  const override = readOverride(tokenId, kind === 'content' ? 'bin' : 'json')
  if (override) {
    const digest = sha256(override)
    const ok = expectedHash ? digest === expectedHash : null
    if (ok === false) warn(warnings, `token ${tokenId} ${kind}: override does NOT match the on-chain hash`)
    return { ...base, buffer: override, source: 'override', verified: ok, bytes: override.length }
  }

  const res = await fetchVerified(uri, expectedHash)
  if (!res.buffer) {
    warn(warnings, `token ${tokenId} ${kind}: UNRESOLVED (${uri}); tried ${GATEWAYS.length} gateways`)
    return { ...base, buffer: null, source: 'unresolved', verified: null, bytes: null }
  }
  if (res.verified === false) {
    warn(warnings, `token ${tokenId} ${kind}: bytes from ${res.gateway} do NOT match the on-chain hash`)
  }

  return {
    ...base,
    buffer: res.buffer,
    source: 'ipfs',
    gateway: res.gateway,
    verified: res.verified,
    bytes: res.buffer.length,
    contentType: res.contentType,
  }
}

async function buildToken({ tokenId, chain, mint, transfers, sale, tsByBlock, args, warnings }) {
  let content = null
  let metadataRef = null
  let metadata = null

  if (!args.skipMetadata) {
    metadataRef = await resolveRef(tokenId, 'metadata', chain.tokenMetadataURI, chain.metadataHash, warnings)
    if (metadataRef.buffer) {
      try {
        metadata = JSON.parse(metadataRef.buffer.toString('utf8'))
      } catch (e) {
        warn(warnings, `token ${tokenId}: metadata is not valid JSON (${e.message})`)
      }
    }
    // The content CID is the artwork itself. Only its size and type are needed here;
    // scripts/snapshot/media.js downloads and commits the bytes.
    const probe = await probeIpfs(chain.tokenURI)
    content = {
      uri: chain.tokenURI || null,
      cid: cidFromUri(chain.tokenURI),
      sha256: chain.contentHash ? `0x${chain.contentHash}` : null,
      gatewayUrl: toCanonicalUrl(chain.tokenURI),
      mimeType: (metadata && metadata.mimeType) || (probe && probe.contentType) || null,
      bytes: probe ? probe.bytes : null,
      // Filled in by scripts/snapshot/media.js once the bytes are committed.
      verified: null,
      width: null,
      height: null,
      localPath: null,
    }
  }

  const mintSeconds = String(tsByBlock.get(mint.blockNumber))

  return {
    tokenId,
    slug: slugFor(tokenId),
    contract: CONTRACT,
    creator: chain.creator,
    // Whoever holds it as of meta.toBlock. Seven of the eight changed hands after
    // their auction, so this is not the same as the winner.
    owner: chain.owner,
    ownerAtSale: sale && sale.status === 'sold' ? sale.winner : null,
    mint: {
      transactionHash: mint.transactionHash,
      blockNumber: mint.blockNumber,
      timestamp: mintSeconds,
      isoTimestamp: isoZ(mintSeconds, mint.logIndex),
      dateTimeLabel: dateTimeLabel(mintSeconds),
    },
    content,
    metadataRef: metadataRef ? { ...metadataRef, buffer: undefined } : null,
    metadata,
    media: {
      // Filled in by scripts/snapshot/media.js.
      imageSrc: null,
      ogImageSrc: null,
      width: null,
      height: null,
    },
    sale: sale || { status: 'never-listed', bids: [] },
    // Provenance only; stripped before these become page props.
    secondaryTransfers: transfers.map((t) => ({
      from: t.from,
      to: t.to,
      blockNumber: t.blockNumber,
      timestamp: String(tsByBlock.get(t.blockNumber)),
      isoTimestamp: isoZ(tsByBlock.get(t.blockNumber), t.logIndex),
      transactionHash: t.transactionHash,
    })),
  }
}

function assertInvariants(snapshot, { partial = false } = {}) {
  const problems = []
  const { tokens, meta } = snapshot
  const push = (m) => problems.push(m)

  if (!tokens.length) push('no tokens in snapshot')
  if (!partial && tokens.length !== TOKEN_IDS.length) {
    push(`expected ${TOKEN_IDS.length} tokens, got ${tokens.length}`)
  }
  if (!partial && meta.counts.auctionsCreated !== TOKEN_IDS.length) {
    push(`expected one auction per token, got ${meta.counts.auctionsCreated}`)
  }

  const slugs = new Set()
  for (const t of tokens) {
    if (slugs.has(t.slug)) push(`duplicate slug ${t.slug}`)
    slugs.add(t.slug)

    if (!t.sale || t.sale.status !== 'sold') {
      push(`token ${t.tokenId} did not sell (status ${t.sale && t.sale.status})`)
      continue
    }
    if (t.sale.currency.id !== '0x0000000000000000000000000000000000000000') {
      push(`token ${t.tokenId} sale currency is not ETH`)
    }
    if (t.sale.finalAmount === '0') push(`token ${t.tokenId} sold for 0`)
    if (!t.sale.bids.length) push(`token ${t.tokenId} sold with no bids`)
    if (
      t.sale.expectedEndTimestamp &&
      Number(t.sale.expectedEndTimestamp) > Number(t.sale.finalizedAt)
    ) {
      push(`token ${t.tokenId} expectedEndTimestamp is after finalizedAt`)
    }
    // The sale price is the winning bid, and bids are sorted descending.
    if (t.sale.bids[0] && t.sale.bids[0].amount !== t.sale.finalAmount) {
      push(`token ${t.tokenId} bids[0] ${t.sale.bids[0].amount} != finalAmount ${t.sale.finalAmount}`)
    }
    for (let i = 1; i < t.sale.bids.length; i++) {
      if (BigInt(t.sale.bids[i].amount) > BigInt(t.sale.bids[i - 1].amount)) {
        push(`token ${t.tokenId} bids are not in descending order at index ${i}`)
      }
    }
    // The price must account for exactly: seller proceeds + curator fee + creator royalty.
    const s = t.sale.settlement
    if (!s) {
      push(`token ${t.tokenId} sale has no settlement breakdown`)
    } else {
      const parts = BigInt(s.tokenOwnerProfit) + BigInt(s.curatorFee) + BigInt(s.creatorShare)
      if (parts !== BigInt(t.sale.finalAmount)) {
        push(`token ${t.tokenId} settlement ${parts} != finalAmount ${t.sale.finalAmount}`)
      }
      if (BigInt(s.creatorShare) < 0n) push(`token ${t.tokenId} negative creator share`)
    }
    if (t.metadataRef && t.metadataRef.verified === false) {
      push(`token ${t.tokenId} metadata failed hash verification`)
    }
  }
  return problems
}

/**
 * Compare only chain-derived data. Which IPFS gateway happened to answer is not
 * deterministic, so including provenance would report drift on every run and make
 * the check useless. The chain half is fully deterministic given the pinned
 * meta.toBlock, and that is the part worth guarding.
 */
const chainOnly = (snap) => ({
  counts: snap.meta.counts,
  fromBlock: snap.meta.fromBlock,
  toBlock: snap.meta.toBlock,
  toBlockHash: snap.meta.toBlockHash,
  tokens: snap.tokens.map((t) => ({
    tokenId: t.tokenId,
    slug: t.slug,
    creator: t.creator,
    owner: t.owner,
    ownerAtSale: t.ownerAtSale,
    contentUri: t.content && t.content.uri,
    contentSha256: t.content && t.content.sha256,
    metadataUri: t.metadataRef && t.metadataRef.uri,
    metadataSha256: t.metadataRef && t.metadataRef.sha256,
    mint: t.mint,
    sale: t.sale,
    secondaryTransfers: t.secondaryTransfers,
  })),
})

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const outFile = path.join(process.cwd(), paths.snapshot)
  const existing = readExisting(outFile)
  const warnings = []

  const pools = {
    logs: createPool(RPC.logs),
    logsChunked: createPool(RPC.logsChunked),
    archive: createPool(RPC.archive),
    batch: createPool(RPC.batch),
  }

  const fromBlock = (existing && existing.meta && existing.meta.fromBlock) || DEFAULT_FROM_BLOCK
  let toBlock = args.toBlock
  // --verify reuses the committed toBlock: re-resolving the head would move the range
  // and report drift for that reason alone, which tells you nothing.
  if (!toBlock && args.verify && existing) toBlock = existing.meta.toBlock
  if (!toBlock) {
    const head = parseInt(await call(pools.batch, 'eth_blockNumber', []), 16)
    toBlock = head - REORG_MARGIN
  }
  log(`range: ${fromBlock} -> ${toBlock} (pinned in meta.toBlock)`)

  const toBlockHash = (
    await call(pools.archive, 'eth_getBlockByNumber', ['0x' + toBlock.toString(16), false])
  ).hash

  log('scanning Transfer logs...')
  const { mint, owner, transfers, transferCount } = await scanTransfers(pools, { fromBlock, toBlock })
  process.stderr.write('\n')
  const secondaryCount = [...transfers.values()].reduce((n, list) => n + list.length, 0)
  log(`  ${transferCount} transfers: ${mint.size} mints, ${secondaryCount} secondary`)

  const contractInfo = await fetchContractInfo(pools)
  log(`  contract: ${contractInfo.name} (${contractInfo.symbol})`)

  log('reading token accessors...')
  const chainData = await fetchTokenData(pools)
  for (const tokenId of TOKEN_IDS) {
    const fromCalls = chainData.get(tokenId).owner
    const fromLogs = owner.get(tokenId)
    if (fromCalls !== fromLogs) {
      warn(
        warnings,
        `token ${tokenId}: ownerOf() at latest is ${fromCalls} but the Transfer scan ` +
          `to block ${toBlock} ends at ${fromLogs} — it moved after meta.toBlock`
      )
    }
  }

  log('scanning AuctionHouse logs...')
  const auctionLogs = await scanAuctionLogs(pools, { fromBlock, toBlock })
  process.stderr.write('\n')
  const { saleByTokenId, counts: auctionCounts } = await buildSales(pools, auctionLogs)
  log(
    `  created=${auctionCounts.auctionsCreated} ended=${auctionCounts.auctionsEnded} ` +
      `canceled=${auctionCounts.auctionsCanceled} bids=${auctionCounts.bids} ` +
      `extensions=${auctionCounts.durationExtensions}`
  )

  const allBlocks = [
    ...TOKEN_IDS.map((id) => mint.get(id).blockNumber),
    ...[...transfers.values()].flat().map((t) => t.blockNumber),
  ]
  const tsByBlock = await fetchBlockTimestamps(pools.batch, allBlocks)

  const targetIds = args.only ? TOKEN_IDS.filter((id) => args.only.includes(id)) : TOKEN_IDS
  log(`building ${targetIds.length} token${targetIds.length === 1 ? '' : 's'}...`)

  const tokens = []
  for (const [i, tokenId] of targetIds.entries()) {
    process.stderr.write(`\r  token ${tokenId} (${i + 1}/${targetIds.length})          `)
    tokens.push(
      await buildToken({
        tokenId,
        chain: chainData.get(tokenId),
        mint: mint.get(tokenId),
        transfers: transfers.get(tokenId),
        sale: saleByTokenId.get(tokenId),
        tsByBlock,
        args,
        warnings,
      })
    )
    await sleep(50)
  }
  process.stderr.write('\n')

  // --only merges into the existing file rather than truncating it. It also preserves
  // whatever media.js already wrote for the untouched tokens.
  let allTokens = tokens
  if (args.only && existing) {
    const byId = new Map(existing.tokens.map((t) => [t.tokenId, t]))
    for (const t of tokens) byId.set(t.tokenId, t)
    allTokens = [...byId.values()]
  }
  allTokens.sort((a, b) => Number(a.tokenId) - Number(b.tokenId))

  const snapshot = {
    meta: {
      generatedAt: new Date().toISOString(),
      networkId: NETWORK_ID,
      contract: CONTRACT,
      contractName: contractInfo.name,
      contractSymbol: contractInfo.symbol,
      auctionHouse: AUCTION_HOUSE,
      fromBlock,
      toBlock,
      toBlockHash,
      tokenIds: TOKEN_IDS,
      siteUrl: SITE_URL,
      counts: {
        tokens: TOKEN_IDS.length,
        transfers: transferCount,
        secondaryTransfers: secondaryCount,
        ...auctionCounts,
      },
      canonicalGateway: CANONICAL_GATEWAY,
      ipfsGateways: GATEWAYS.map((g) => g.base),
      rpcEndpoints: [...new Set([...RPC.logs, ...RPC.logsChunked, ...RPC.batch])],
      warnings,
    },
    tokens: allTokens,
  }

  if (args.verify) {
    if (!existing) {
      console.error('--verify: no existing snapshot to compare against')
      process.exit(2)
    }
    const before = chainOnly(existing)
    const after = chainOnly(snapshot)
    const drifted = JSON.stringify(before) !== JSON.stringify(after)

    if (drifted) {
      console.error('DRIFT: re-derived chain data differs from the committed snapshot')
      for (const token of after.tokens) {
        const prev = before.tokens.find((t) => t.tokenId === token.tokenId)
        if (!prev) {
          console.error(`  token ${token.tokenId}: new`)
        } else if (JSON.stringify(prev) !== JSON.stringify(token)) {
          const fields = Object.keys(token).filter(
            (k) => JSON.stringify(prev[k]) !== JSON.stringify(token[k])
          )
          console.error(`  token ${token.tokenId}: ${fields.join(', ')}`)
        }
      }
      if (JSON.stringify(before.counts) !== JSON.stringify(after.counts)) {
        console.error(
          `  counts: ${JSON.stringify(before.counts)} -> ${JSON.stringify(after.counts)}`
        )
      }
    } else {
      console.log(`OK: chain data reproduces exactly (${after.tokens.length} tokens)`)
    }
    process.exit(drifted ? 1 : 0)
  }

  // Preserve what media.js wrote — a plain `yarn snapshot` re-run must not blank the
  // committed image pointers and force a re-download.
  if (existing) {
    const byId = new Map(existing.tokens.map((t) => [t.tokenId, t]))
    for (const t of allTokens) {
      const prev = byId.get(t.tokenId)
      if (!prev) continue
      if (prev.media && prev.media.imageSrc) t.media = prev.media
      if (prev.content && t.content && prev.content.cid === t.content.cid) {
        t.content.verified = prev.content.verified
        t.content.width = prev.content.width
        t.content.height = prev.content.height
        t.content.localPath = prev.content.localPath
        if (prev.content.bytes) t.content.bytes = prev.content.bytes
      }
      if (prev.metadataRef && t.metadataRef && prev.metadataRef.cid === t.metadataRef.cid) {
        t.metadataRef.localPath = prev.metadataRef.localPath
      }
    }
  }

  const problems = assertInvariants(snapshot, {
    partial: Boolean(args.only) && allTokens.length !== TOKEN_IDS.length,
  })

  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(outFile, JSON.stringify(snapshot, null, 2) + '\n')
  log(`\nwrote ${paths.snapshot} (${allTokens.length} tokens, ${warnings.length} warnings)`)

  const verified = allTokens.filter((t) => t.metadataRef && t.metadataRef.verified === true).length
  const unresolved = allTokens.filter((t) => t.metadataRef && t.metadataRef.source === 'unresolved')
  log(`metadata: ${verified}/${allTokens.length} hash-verified, ${unresolved.length} unresolved`)
  if (unresolved.length) log(`  unresolved: ${unresolved.map((t) => t.tokenId).join(',')}`)
  log(`next: yarn snapshot:media`)

  if (problems.length) {
    console.error(`\n${problems.length} invariant failure(s):`)
    for (const p of problems) console.error(`  - ${p}`)
    process.exit(1)
  }
  log('all invariants passed')
}

main().catch((e) => {
  console.error('\n' + (e && e.stack ? e.stack : e))
  process.exit(1)
})
