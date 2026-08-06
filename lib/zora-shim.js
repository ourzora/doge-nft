/**
 * Builds the value @zoralabs/nft-components' NFTDataContext expects, straight from a
 * committed snapshot token.
 *
 * Why this exists: NFTFullPage and NFTPreview are data *providers*. Each mounts its
 * own NFTDataProvider, which calls useNFT(), which fetches from Zora's indexer and
 * the ourzora/zora-v1 subgraph — both permanently offline. They cannot be configured
 * out of it: the URLs are hardcoded in nft-hooks/dist/constants/urls.js and the
 * package reads no env vars.
 *
 * So instead of using those two components, we supply the context ourselves and
 * render their children directly. The rendering half of the library — MediaFull,
 * MediaInfo, MediaThumbnail, ProofAuthenticity — keeps working with all of its
 * existing class names and emotion styles, which is what the ~26 `.zora-*` selectors
 * across four of our stylesheets depend on, and useNFT never mounts.
 *
 * The shape below is nft-hooks 1.2.x's NFTObject. Nothing here is type-checked
 * against Zora's types, so the load-bearing fields are commented inline; they were
 * read off the compiled components in node_modules/@zoralabs/nft-components/dist.
 *
 * Note this is materially different from the equivalent shim in the holly-plus
 * archive, which targets 0.3.x. That version exposed raw subgraph fragments; 1.2.x
 * exposes the normalized ZDK shape, and several of the rules are inverted. Where
 * that is true it is called out below.
 */

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// Enum *values* are inlined rather than imported from @zoralabs/nft-hooks. Importing
// the enums would pull the hooks package — and its dead-host constants — into any
// bundle that reaches this module.
const MARKET_TYPE_AUCTION = 'Auction'
const AUCTION_SOURCE_ZORA_RESERVE_V2 = 'ZoraReserveV2'
const MARKET_STATUS_COMPLETE = 'complete'
const TOKEN_MARKET_EVENT = 'TokenMarketEvent'
const AUCTION_CREATED = 'AuctionCreated'
const AUCTION_APPROVED = 'AuctionApproved'

/**
 * A CurrencyValue. PricingString reads `.amount.value` (and skips the whole span if
 * it is falsy) and `.symbol`; `usd` is deliberately absent so it never renders a "$…"
 * figure, which a static archive has no source for.
 */
const currencyValue = (wei, value) => ({
  amount: { raw: wei, value, decimals: 18 },
  eth: { raw: wei, value, decimals: 18 },
  usd: undefined,
  symbol: 'ETH',
  name: 'Ether',
  address: ZERO_ADDRESS,
})

const bidEvent = (bid) => ({
  creator: bid.bidder,
  amount: currencyValue(bid.amount, bid.amountEthNumber),
  created: { timestamp: bid.isoTimestamp, transactionHash: bid.transactionHash },
})

function buildAuction(sale, meta) {
  const winningBid = sale.bids[0]

  return {
    type: MARKET_TYPE_AUCTION,
    // PricingComponent and AuctionInfo both locate the auction by `source`, and
    // MediaThumbnailWrapper keys its `auctionStatus` style flag off `status`.
    source: AUCTION_SOURCE_ZORA_RESERVE_V2,
    status: MARKET_STATUS_COMPLETE,
    auctionId: sale.auctionId,
    marketContract: meta.auctionHouse,
    duration: Number(sale.finalDuration),
    raw: { curator: sale.curator, curatorFeePercentage: sale.curatorFeePercentage },

    createdAt: { timestamp: sale.createdAtIso, transactionHash: sale.createdAtTx },
    createdBy: sale.tokenOwner,
    // When the auction actually closed (firstBidTime + finalDuration), not when
    // someone got round to settling it.
    finishedAt: { timestamp: sale.expectedEndIso, transactionHash: sale.finalizedAtTx },
    canceledAt: undefined,
    startedAt: { timestamp: sale.firstBidIso },
    endsAt: { timestamp: sale.expectedEndIso },

    winner: sale.winner,
    reservePrice: currencyValue(sale.reservePrice, sale.reservePriceEthNumber),
    amount: currencyValue(sale.finalAmount, sale.finalAmountEthNumber),

    /**
     * Required, not optional. AuctionInfo's `status === "complete"` branch reads
     * `reserveAuction.currentBid.creator` with no optional chaining, so omitting this
     * throws. That is the inverse of 0.3.x, where the subgraph cleared currentBid once
     * an auction finished and the shim had to leave it undefined.
     */
    currentBid: winningBid ? bidEvent(winningBid) : undefined,
    bids: sale.bids.map(bidEvent),
  }
}

/**
 * The two history rows that BidHistory only derives from `events`.
 *
 * It builds "minted" from nft.minted, and the bids and the win from markets[], but
 * "created the auction" and "approved the auction" exist only as market events. We
 * deliberately do NOT emit AUCTION_BID events here — those would duplicate the ones
 * markets[].bids already produces.
 */
function buildEvents(sale, meta) {
  const at = (timestamp, transactionHash) => ({ timestamp, transactionHash })
  const base = { eventType: TOKEN_MARKET_EVENT, marketAddress: meta.auctionHouse }
  return [
    {
      ...base,
      event: AUCTION_CREATED,
      sender: sale.tokenOwner,
      at: at(sale.createdAtIso, sale.createdAtTx),
      price: {
        symbol: 'ETH',
        nativePrice: { raw: sale.reservePrice, decimal: sale.reservePriceEthNumber, decimals: 18 },
      },
    },
    {
      ...base,
      event: AUCTION_APPROVED,
      sender: sale.curator,
      at: at(sale.approvedAtIso, sale.approvedAtTx),
    },
  ]
}

export function buildNFTDataContextValue(token, meta) {
  const sale = token.sale && token.sale.status === 'sold' && token.sale.bids.length ? token.sale : null

  const data = {
    /**
     * Required. ProofAuthenticity indexes `data.rawData["zora-indexer"]` unguarded,
     * so this must be an object. Leaving it empty is also what suppresses the
     * now-dead zora.co/collections link — as does omitting `knownContract` below.
     */
    rawData: {},

    nft: {
      tokenId: token.tokenId,
      tokenUrlMimeType: token.content.mimeType,
      contract: {
        address: token.contract,
        name: meta.contractName,
        symbol: meta.contractSymbol,
        // No `knownContract: 'zora'` — it re-enables the dead zora.co link.
      },
      minted: {
        address: token.creator,
        at: {
          timestamp: token.mint.isoTimestamp,
          blockNumber: token.mint.blockNumber,
          transactionHash: token.mint.transactionHash,
        },
      },
      owner: { address: token.owner },
      metadataURI: token.metadataRef.gatewayUrl,
      /**
       * ProofAuthenticity renders this as the "View on IPFS" href and picks its label
       * by testing for "/ipfs/", so it has to be the http(s) gateway URL rather than
       * the ipfs:// form or our local path.
       */
      contentURI: token.content.gatewayUrl,
    },

    metadata: {
      name: token.metadata.name,
      description: token.metadata.description,
      // The committed local copy. getNormalizedURI only rewrites URIs containing
      // "/ipfs/", so a /media/... path reaches the <img> untouched.
      imageUri: token.media.imageSrc,
      /**
       * Must stay undefined. MediaObject calls useNFTContent(contentURI ?? contentUri),
       * and any value here gives that SWR call a key and fires a request at Zora's dead
       * pinata gateway. We no longer render MediaObject (see media-image.js), so
       * nothing reads this today — but leaving it undefined is what keeps the stock
       * components safe to swap back in.
       */
      contentUri: undefined,
      attributes: undefined,
      raw: token.metadata,
    },

    markets: sale ? [buildAuction(sale, meta)] : [],
    events: sale ? buildEvents(sale, meta) : [],
  }

  return { data, currencyLoaded: true, error: undefined, marketError: undefined }
}
