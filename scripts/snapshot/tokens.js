const { utils } = require('ethers')
const { CONTRACT, TOKEN_IDS, ZERO_ADDRESS } = require('./config')
const {
  TRANSFER_TOPIC,
  TOKEN_ID_TOPICS,
  SELECTORS,
  encodeCall,
  decodeString,
  decodeAddress,
  decodeBytes32,
} = require('./abi')
const { toHex, call, batch, getLogs } = require('./rpc')

/**
 * Every Transfer touching our eight token ids, mint included.
 *
 * On a dedicated collection you would scan Transfer for the whole contract and read
 * the alive set, owners and minters straight out of it. Zora Media V1 is shared by
 * every Zora V1 creator, so that scan is enormous and mostly other people's tokens.
 * tokenId is indexed as topics[3] on ERC-721 Transfer, so filtering on our eight ids
 * gives the same information in 52 logs.
 */
async function scanTransfers(pools, { fromBlock, toBlock }) {
  const logs = await getLogs(
    pools.logs,
    pools.logsChunked,
    {
      address: CONTRACT,
      fromBlock: toHex(fromBlock),
      toBlock: toHex(toBlock),
      topics: [TRANSFER_TOPIC, null, null, TOKEN_ID_TOPICS],
    },
    {
      onProgress: (at, end, count) =>
        process.stderr.write(`\r  transfers: block ${at}/${end}, ${count} logs`),
    }
  )

  const ordered = logs
    .map((l) => ({
      from: utils.getAddress('0x' + l.topics[1].slice(-40)),
      to: utils.getAddress('0x' + l.topics[2].slice(-40)),
      tokenId: BigInt(l.topics[3]).toString(),
      blockNumber: parseInt(l.blockNumber, 16),
      logIndex: parseInt(l.logIndex, 16),
      transactionHash: l.transactionHash,
    }))
    .sort((a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex)

  const mint = new Map()
  const owner = new Map()
  const transfers = new Map(TOKEN_IDS.map((id) => [id, []]))

  for (const t of ordered) {
    if (!transfers.has(t.tokenId)) continue
    if (t.from === ZERO_ADDRESS && !mint.has(t.tokenId)) mint.set(t.tokenId, t)
    else transfers.get(t.tokenId).push(t)
    owner.set(t.tokenId, t.to)
  }

  const missing = TOKEN_IDS.filter((id) => !mint.has(id))
  if (missing.length) {
    throw new Error(
      `no mint (Transfer from 0x0) found for token(s) ${missing.join(',')} in ` +
        `blocks ${fromBlock}..${toBlock} — is DEFAULT_FROM_BLOCK too high?`
    )
  }

  return { mint, owner, transfers, transferCount: ordered.length }
}

/**
 * One batched round of eth_calls for the per-token accessors: 6 × 8 = 48 requests.
 *
 * These are read at `latest` rather than at meta.toBlock. tokenURI, tokenMetadataURI,
 * both hashes and the creator are immutable on this contract, so only `ownerOf` could
 * differ — and it is cross-checked against the Transfer scan below, which is what
 * pins ownership to meta.toBlock.
 */
async function fetchTokenData(pools, tokenIds = TOKEN_IDS) {
  const fields = [
    ['tokenURI', SELECTORS.tokenURI, decodeString],
    ['tokenMetadataURI', SELECTORS.tokenMetadataURI, decodeString],
    ['contentHash', SELECTORS.tokenContentHashes, decodeBytes32],
    ['metadataHash', SELECTORS.tokenMetadataHashes, decodeBytes32],
    ['creator', SELECTORS.tokenCreators, decodeAddress],
    ['owner', SELECTORS.ownerOf, decodeAddress],
  ]

  const requests = []
  for (const tokenId of tokenIds) {
    for (const [, selector] of fields) {
      requests.push({
        method: 'eth_call',
        params: [{ to: CONTRACT, data: encodeCall(selector, tokenId) }, 'latest'],
      })
    }
  }

  const results = await batch(pools.batch, requests)
  const out = new Map()
  let cursor = 0
  for (const tokenId of tokenIds) {
    const row = {}
    for (const [key, , decode] of fields) {
      const r = results[cursor++]
      if (r.error) throw new Error(`token ${tokenId} ${key}: ${JSON.stringify(r.error)}`)
      row[key] = decode(r.result)
    }
    out.set(tokenId, row)
  }
  return out
}

async function fetchContractInfo(pools) {
  const [name, symbol] = await Promise.all(
    [SELECTORS.name, SELECTORS.symbol].map((selector) =>
      call(pools.batch, 'eth_call', [{ to: CONTRACT, data: selector }, 'latest'])
    )
  )
  return { name: decodeString(name), symbol: decodeString(symbol) }
}

module.exports = { scanTransfers, fetchTokenData, fetchContractInfo }
