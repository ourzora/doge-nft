const { utils } = require('ethers')
const { AUCTION_HOUSE, CONTRACT, ETH_CURRENCY } = require('./config')
const { auctionHouseInterface, AUCTION_TOPICS, TOKEN_ID_TOPICS } = require('./abi')
const { toHex, getLogs, fetchBlockTimestamps } = require('./rpc')

/**
 * Every AuctionHouse event for our eight tokens.
 *
 * auctionId, tokenId and tokenContract are all indexed, so one filtered request
 * returns the complete auction history (156 logs) with no join back to tokenId — it
 * is always topics[2]. Filtering on tokenContract alone is not enough here: Zora
 * Media V1 is shared, and that filter returns every auction ever run on it (16,026
 * logs). TOKEN_ID_TOPICS in the topics[2] position is what makes this small.
 */
async function scanAuctionLogs(pools, { fromBlock, toBlock }) {
  const logs = await getLogs(
    pools.logs,
    pools.logsChunked,
    {
      address: AUCTION_HOUSE,
      fromBlock: toHex(fromBlock),
      toBlock: toHex(toBlock),
      topics: [
        Object.keys(AUCTION_TOPICS),
        null,
        TOKEN_ID_TOPICS,
        [utils.hexZeroPad(CONTRACT.toLowerCase(), 32)],
      ],
    },
    {
      onProgress: (at, end, count) =>
        process.stderr.write(`\r  auctions: block ${at}/${end}, ${count} logs`),
    }
  )

  return logs
    .map((l) => {
      const name = AUCTION_TOPICS[l.topics[0]]
      const parsed = auctionHouseInterface.parseLog(l)
      return {
        name,
        args: parsed.args,
        auctionId: BigInt(l.topics[1]).toString(),
        tokenId: BigInt(l.topics[2]).toString(),
        blockNumber: parseInt(l.blockNumber, 16),
        logIndex: parseInt(l.logIndex, 16),
        transactionHash: l.transactionHash,
      }
    })
    .sort((a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex)
}

/* ------------------------------------------------------------------ *
 * Display strings.
 *
 * All of these are computed here, once, and committed. Nothing formats a
 * number or a date at render time: `Intl.NumberFormat` in the Zora components
 * keys off `navigator.language` in the browser but `en-US` on the server, and
 * `toLocaleString` keys off the machine timezone, so both produce a React 18
 * hydration mismatch when the data is present at SSR.
 *
 * They are also hand-rolled rather than delegating to `Intl` so that `--verify`
 * reproduces byte-identically regardless of the ICU build Node was compiled with.
 * ------------------------------------------------------------------ */

/** Wei -> decimal ether, trailing zeros stripped. Matches PricingString's maximumFractionDigits. */
const formatEth = (wei, maxDecimals = 8) => {
  const full = utils.formatEther(wei)
  if (!full.includes('.')) return full
  const [int, frac] = full.split('.')
  const trimmed = frac.slice(0, maxDecimals).replace(/0+$/, '')
  return trimmed ? `${int}.${trimmed}` : int
}

/** 1696.9 -> "1,696.9". What Intl.NumberFormat('en-US', {style:'decimal'}) would emit. */
function groupThousands(decimalString) {
  const [int, frac] = String(decimalString).split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return frac ? `${grouped}.${frac}` : grouped
}

/** "1,696.9 ETH" — the exact output of <PricingString> for this amount. */
const amountLabel = (wei) => `${groupThousands(formatEth(wei))} ${ETH_CURRENCY.symbol}`

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** "Jun 2021", UTC. */
function monthYearLabel(unixSeconds) {
  if (unixSeconds == null) return null
  const d = new Date(Number(unixSeconds) * 1000)
  return `${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/**
 * "June 11, 2021, 10:23 PM UTC".
 *
 * Same field set as BidHistory's formatDate — toLocaleString("en-US", {month:"long",
 * day:"numeric", hour:"2-digit", minute:"2-digit", year:"numeric", hour12:true}) —
 * pinned to UTC and labelled as such, since a static archive has no visitor timezone
 * to be correct in.
 */
function dateTimeLabel(unixSeconds) {
  if (unixSeconds == null) return null
  const d = new Date(Number(unixSeconds) * 1000)
  const h24 = d.getUTCHours()
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  const hh = String(h12).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return (
    `${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}, ` +
    `${hh}:${mm} ${h24 < 12 ? 'AM' : 'PM'} UTC`
  )
}

/**
 * Full ISO-8601 *with* a trailing Z.
 *
 * Note this is the opposite of what nft-components 0.3.x required: that version did
 * `new Date(timestamp + "Z")` and so needed a naive string. 1.2.x does plain
 * `new Date(timestamp)` against values the ZDK produced with toISOString(), so the Z
 * has to be present or every date is parsed as local time.
 *
 * The milliseconds field carries `logIndex % 1000`. Two bids in the same block
 * otherwise produce identical timestamps, which both collide on BidHistory's
 * `key={actor}-{createdAt}` and tie in its sort. Milliseconds are never displayed.
 */
function isoZ(unixSeconds, logIndex = 0) {
  if (unixSeconds == null) return null
  const ms = ((Number(logIndex) % 1000) + 1000) % 1000
  return new Date(Number(unixSeconds) * 1000 + ms).toISOString()
}

/** Reduce one auction's event group into the shape the pages and the shim consume. */
function reduceAuction(group, tsByBlock) {
  const created = group.find((l) => l.name === 'AuctionCreated')
  if (!created) return null

  const approvals = group.filter((l) => l.name === 'AuctionApprovalUpdated' && l.args.approved)
  const reserveUpdates = group.filter((l) => l.name === 'AuctionReservePriceUpdated')
  const bidLogs = group.filter((l) => l.name === 'AuctionBid')
  const extensions = group.filter((l) => l.name === 'AuctionDurationExtended')
  const ended = group.find((l) => l.name === 'AuctionEnded')
  const canceled = group.find((l) => l.name === 'AuctionCanceled')

  const ts = (log) => String(tsByBlock.get(log.blockNumber))
  const iso = (log) => isoZ(tsByBlock.get(log.blockNumber), log.logIndex)
  const approved = approvals.length ? approvals[approvals.length - 1] : null

  const base = {
    auctionId: created.auctionId,
    currency: ETH_CURRENCY,
    tokenOwner: created.args.tokenOwner,
    curator: created.args.curator,
    curatorFeePercentage: Number(created.args.curatorFeePercentage),
    duration: created.args.duration.toString(),
    createdAt: ts(created),
    createdAtIso: iso(created),
    createdAtLabel: dateTimeLabel(ts(created)),
    createdAtTx: created.transactionHash,
    approvedAt: approved ? ts(approved) : ts(created),
    approvedAtIso: approved ? iso(approved) : iso(created),
    approvedAtLabel: dateTimeLabel(approved ? ts(approved) : ts(created)),
    approvedAtTx: approved ? approved.transactionHash : created.transactionHash,
  }

  const reservePrice = (
    reserveUpdates.length
      ? reserveUpdates[reserveUpdates.length - 1].args.reservePrice
      : created.args.reservePrice
  ).toString()

  const reserve = {
    reservePrice,
    reservePriceEth: formatEth(reservePrice),
    reservePriceEthNumber: Number(formatEth(reservePrice)),
    reservePriceLabel: amountLabel(reservePrice),
  }

  if (canceled && !ended) {
    return {
      ...base,
      ...reserve,
      status: 'canceled',
      canceledAt: ts(canceled),
      canceledAtIso: iso(canceled),
      canceledAtTx: canceled.transactionHash,
      bids: [],
    }
  }

  if (!ended) {
    return { ...base, ...reserve, status: 'never-listed', bids: [] }
  }

  // AuctionDurationExtended.duration is the new TOTAL duration, not a delta.
  const finalDuration = (
    extensions.length ? extensions[extensions.length - 1].args.duration : created.args.duration
  ).toString()

  const firstBidTime = bidLogs.length ? String(tsByBlock.get(bidLogs[0].blockNumber)) : null

  /**
   * Reproduces the old subgraph's expectedEndTimestamp. This — not the AuctionEnded
   * block — is when the auction actually closed. Settlement is a separate, permissionless
   * transaction that anyone can send whenever they like; on the holly-plus collection four
   * auctions were not settled until years after they ended. All eight of these were settled
   * promptly, but using AuctionEnded as the sale date would still be wrong in principle.
   */
  const expectedEndTimestamp = firstBidTime
    ? String(Number(firstBidTime) + Number(finalDuration))
    : null

  // Descending, so bids[0] is the winning bid: the Zora components index the first
  // element of a bid array without sorting it.
  const bids = bidLogs
    .slice()
    .sort((a, b) => b.blockNumber - a.blockNumber || b.logIndex - a.logIndex)
    .map((b, i) => {
      const amount = b.args.value.toString()
      const seconds = String(tsByBlock.get(b.blockNumber))
      return {
        id: `${created.auctionId}-${i}`,
        bidder: b.args.sender,
        amount,
        amountEth: formatEth(amount),
        amountEthNumber: Number(formatEth(amount)),
        amountLabel: amountLabel(amount),
        timestamp: seconds,
        isoTimestamp: isoZ(seconds, b.logIndex),
        dateTimeLabel: dateTimeLabel(seconds),
        transactionHash: b.transactionHash,
        blockNumber: b.blockNumber,
        logIndex: b.logIndex,
        firstBid: Boolean(b.args.firstBid),
        extended: Boolean(b.args.extended),
      }
    })

  /**
   * The sale price is the winning BID, not AuctionEnded.amount.
   *
   * AuctionEnded.amount is `tokenOwnerProfit` — what the seller actually received
   * after the AuctionHouse routed settlement through Zora Media's bidShares. For
   * token 3366 that is 1511.9379 ETH against a winning bid of 1696.9: a 10% on-chain
   * creator royalty (169.69) plus a 1% curator fee levied on the remainder (15.2721).
   *
   * Reading `amount` as the sale price would understate every sale here by ~11% and
   * contradict the figure this auction is publicly known for. The distinction does
   * not arise on a plain ERC-721 with a 0% curator fee, where the two are equal.
   */
  const winningBid = bids[0]
  const tokenOwnerProfit = ended.args.amount.toString()
  const curatorFee = ended.args.curatorFee.toString()
  const finalAmount = winningBid ? winningBid.amount : tokenOwnerProfit
  const creatorShare = (
    BigInt(finalAmount) - BigInt(tokenOwnerProfit) - BigInt(curatorFee)
  ).toString()

  return {
    ...base,
    ...reserve,
    status: 'sold',
    finalDuration,
    firstBidTime,
    firstBidIso: firstBidTime ? isoZ(firstBidTime) : null,
    expectedEndTimestamp,
    expectedEndIso: expectedEndTimestamp ? isoZ(expectedEndTimestamp) : null,
    finalizedAt: ts(ended),
    finalizedAtIso: iso(ended),
    finalizedAtTx: ended.transactionHash,
    winner: ended.args.winner,
    // The winning bid: the price paid, and what the site displays.
    finalAmount,
    finalAmountEth: formatEth(finalAmount),
    finalAmountEthNumber: Number(formatEth(finalAmount)),
    soldAmountLabel: amountLabel(finalAmount),
    soldDateLabel: monthYearLabel(expectedEndTimestamp || ts(ended)),
    soldDateTimeLabel: dateTimeLabel(expectedEndTimestamp || ts(ended)),
    // How that price was split. Recorded for provenance; not rendered.
    settlement: {
      tokenOwnerProfit,
      tokenOwnerProfitEth: formatEth(tokenOwnerProfit),
      curatorFee,
      curatorFeeEth: formatEth(curatorFee),
      creatorShare,
      creatorShareEth: formatEth(creatorShare),
    },
    bids,
  }
}

/** Group logs by auctionId, reduce each, then pick one sale per token. */
async function buildSales(pools, logs) {
  const timestamps = await fetchBlockTimestamps(
    pools.batch,
    logs.map((l) => l.blockNumber)
  )

  const byAuction = new Map()
  for (const log of logs) {
    if (!byAuction.has(log.auctionId)) byAuction.set(log.auctionId, [])
    byAuction.get(log.auctionId).push(log)
  }

  const auctions = []
  for (const [auctionId, group] of byAuction) {
    const reduced = reduceAuction(group, timestamps)
    if (reduced) auctions.push({ ...reduced, tokenId: group[0].tokenId, auctionId })
  }

  // Prefer the auction that actually ended; otherwise the most recent one. These
  // eight had exactly one auction each, but the site's git history mentions a
  // "second auction round", so the tie-break stays in rather than assuming.
  const saleByTokenId = new Map()
  for (const a of auctions) {
    const existing = saleByTokenId.get(a.tokenId)
    if (!existing) {
      saleByTokenId.set(a.tokenId, a)
      continue
    }
    const better =
      (a.status === 'sold' && existing.status !== 'sold') ||
      (a.status === existing.status && Number(a.createdAt) > Number(existing.createdAt))
    if (better) saleByTokenId.set(a.tokenId, a)
  }

  const counts = {
    auctionsCreated: auctions.length,
    auctionsEnded: auctions.filter((a) => a.status === 'sold').length,
    auctionsCanceled: auctions.filter((a) => a.status === 'canceled').length,
    bids: logs.filter((l) => l.name === 'AuctionBid').length,
    durationExtensions: logs.filter((l) => l.name === 'AuctionDurationExtended').length,
  }

  return { saleByTokenId, auctions, counts, timestamps }
}

module.exports = {
  scanAuctionLogs,
  buildSales,
  reduceAuction,
  formatEth,
  groupThousands,
  amountLabel,
  monthYearLabel,
  dateTimeLabel,
  isoZ,
}
