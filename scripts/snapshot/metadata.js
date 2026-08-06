const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { GATEWAYS, CANONICAL_GATEWAY, USER_AGENT, paths } = require('./config')
const { sleep } = require('./rpc')

/** Bare lowercase hex sha256 of a buffer, no 0x prefix. */
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex')

// IPFS_GATEWAYS=ipfs.io,dweb narrows the list. Each unreachable gateway costs a full
// timeout per CID, so on a bad day it is faster to pin to the ones that answer.
const ACTIVE_GATEWAYS = process.env.IPFS_GATEWAYS
  ? GATEWAYS.filter((g) => process.env.IPFS_GATEWAYS.split(',').some((f) => g.base.includes(f)))
  : GATEWAYS

/**
 * ipfs://CID/path%20with%20encoding -> <gateway>CID/path%20with%20encoding
 * Also strips a dead gateway prefix: this contract's on-chain tokenURI is a full
 * https://ipfs.fleek.co/ipfs/<cid> URL, not an ipfs:// URI, and fleek is gone.
 * Never decode/re-encode — any %20 in a path must survive verbatim or gateways 404.
 */
const stripScheme = (uri) =>
  String(uri)
    .replace(/^ipfs:\/\//, '')
    .replace(/^https?:\/\/[^/]+\/ipfs\//, '')

/** The CID (without any trailing path) that a URI resolves to. */
const cidFromUri = (uri) => (uri ? stripScheme(uri).split('/')[0] : null)

const toGatewayUrl = (base, uri) => base + stripScheme(uri)
const toCanonicalUrl = (uri) => (uri ? toGatewayUrl(CANONICAL_GATEWAY, uri) : null)

const candidateUrls = (uri) =>
  ACTIVE_GATEWAYS.map((gw) => ({
    url: toGatewayUrl(gw.base, uri),
    headers: gw.headers,
    source: gw.base,
  }))

/**
 * Fetch with a deadline that covers the response BODY, not just the headers.
 *
 * This matters more than it looks. Several IPFS gateways answer with headers
 * immediately and then stall mid-body. Clearing the abort timer as soon as `fetch`
 * resolves leaves the subsequent read unbounded, and the script hangs forever instead
 * of failing over to the next gateway. So when a body is wanted, it is read here,
 * inside the same timer scope.
 */
async function fetchOnce(url, { headers = {}, timeoutMs = 60000, method = 'GET', read } = {}) {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method,
      headers: { 'user-agent': USER_AGENT, ...headers },
      signal: ctl.signal,
      redirect: 'follow',
    })
    if (read === 'buffer' && res.ok) {
      return { res, buffer: Buffer.from(await res.arrayBuffer()) }
    }
    if (read === 'buffer') return { res, buffer: null }
    return res
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Try every gateway in order, `passes` times. Provider discovery on the DHT is slow
 * and non-deterministic — the same CID can fail on one gateway and succeed on another
 * within the same minute, so breadth plus repetition both matter.
 */
async function fetchIpfs(
  uri,
  {
    passes = Number(process.env.IPFS_PASSES || 3),
    timeoutMs = Number(process.env.IPFS_TIMEOUT_MS || 60000),
  } = {}
) {
  const errors = []
  const candidates = candidateUrls(uri)
  for (let pass = 0; pass < passes; pass++) {
    for (const candidate of candidates) {
      try {
        const { res, buffer } = await fetchOnce(candidate.url, {
          headers: candidate.headers,
          timeoutMs,
          read: 'buffer',
        })
        if (!res.ok || !buffer) {
          errors.push(`${candidate.source} -> ${res.status}`)
          continue
        }
        return {
          buffer,
          gateway: candidate.source,
          contentType: res.headers.get('content-type'),
          errors,
        }
      } catch (e) {
        errors.push(`${candidate.source} -> ${e.name === 'AbortError' ? 'timeout' : e.message}`)
      }
    }
    if (pass < passes - 1) await sleep(2000 * (pass + 1))
  }
  return { buffer: null, errors }
}

/**
 * Fetch a URI and prove the bytes are the ones that were minted.
 *
 * Zora Media V1 records sha256(content) and sha256(metadata) on chain at mint time,
 * so this is a direct hash comparison — strictly stronger than inferring a digest
 * from the CID, which only works for raw-codec (`bafkrei…`) CIDs and cannot verify
 * the dag-pb (`bafybei…`) CIDs this collection actually uses.
 *
 * Returns verified: true (proven), false (mismatch), or null (no on-chain hash).
 */
async function fetchVerified(uri, expectedSha256, opts) {
  const res = await fetchIpfs(uri, opts)
  if (!res.buffer) return { buffer: null, verified: null, errors: res.errors }

  const digest = sha256(res.buffer)
  const expected = expectedSha256 ? String(expectedSha256).replace(/^0x/, '').toLowerCase() : null

  return {
    buffer: res.buffer,
    sha256: digest,
    gateway: res.gateway,
    contentType: res.contentType,
    verified: expected ? digest === expected : null,
    errors: res.errors,
  }
}

/** HEAD a URI to learn its size and content type without downloading it. */
async function probeIpfs(uri, { timeoutMs = 45000 } = {}) {
  if (!uri) return null
  const errors = []
  for (const candidate of candidateUrls(uri)) {
    try {
      const res = await fetchOnce(candidate.url, {
        headers: candidate.headers,
        timeoutMs,
        method: 'HEAD',
      })
      if (!res.ok) {
        errors.push(`${candidate.source} -> ${res.status}`)
        continue
      }
      const len = res.headers.get('content-length')
      return {
        gateway: candidate.source,
        bytes: len ? Number(len) : null,
        contentType: res.headers.get('content-type'),
      }
    } catch (e) {
      errors.push(`${candidate.source} -> ${e.name === 'AbortError' ? 'timeout' : e.message}`)
    }
  }
  return { gateway: null, bytes: null, contentType: null, errors }
}

/**
 * Hand-recovered bytes committed at scripts/snapshot/overrides/<tokenId>.<ext>, for a
 * CID no gateway will serve any more. Because the expected sha256 is on chain, an
 * override can still be proven correct rather than merely trusted — so this is a
 * recovery path, not a trust hole. Nothing needs one today.
 */
function readOverride(tokenId, ext, root = process.cwd()) {
  const file = path.join(root, paths.overrides, `${tokenId}.${ext}`)
  if (!fs.existsSync(file)) return null
  return fs.readFileSync(file)
}

/** width/height straight out of a PNG IHDR chunk. Null for anything that isn't a PNG. */
function pngDimensions(buffer) {
  const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(SIGNATURE)) return null
  if (buffer.subarray(12, 16).toString('ascii') !== 'IHDR') return null
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

module.exports = {
  sha256,
  stripScheme,
  cidFromUri,
  toGatewayUrl,
  toCanonicalUrl,
  fetchOnce,
  fetchIpfs,
  fetchVerified,
  probeIpfs,
  readOverride,
  pngDimensions,
}
