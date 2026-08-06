const { utils } = require('ethers')
const { TOKEN_IDS } = require('./config')

// Zora V1 AuctionHouse (@zoralabs/auction-house@1.1.3) events.
const AUCTION_HOUSE_EVENTS = [
  'event AuctionCreated(uint256 indexed auctionId, uint256 indexed tokenId, address indexed tokenContract, uint256 duration, uint256 reservePrice, address tokenOwner, address curator, uint8 curatorFeePercentage, address auctionCurrency)',
  'event AuctionApprovalUpdated(uint256 indexed auctionId, uint256 indexed tokenId, address indexed tokenContract, bool approved)',
  'event AuctionReservePriceUpdated(uint256 indexed auctionId, uint256 indexed tokenId, address indexed tokenContract, uint256 reservePrice)',
  'event AuctionBid(uint256 indexed auctionId, uint256 indexed tokenId, address indexed tokenContract, address sender, uint256 value, bool firstBid, bool extended)',
  'event AuctionDurationExtended(uint256 indexed auctionId, uint256 indexed tokenId, address indexed tokenContract, uint256 duration)',
  'event AuctionEnded(uint256 indexed auctionId, uint256 indexed tokenId, address indexed tokenContract, address tokenOwner, address curator, address winner, uint256 amount, uint256 curatorFee, address auctionCurrency)',
  'event AuctionCanceled(uint256 indexed auctionId, uint256 indexed tokenId, address indexed tokenContract, address tokenOwner)',
]

const auctionHouseInterface = new utils.Interface(AUCTION_HOUSE_EVENTS)

const AUCTION_EVENT_NAMES = [
  'AuctionCreated',
  'AuctionApprovalUpdated',
  'AuctionReservePriceUpdated',
  'AuctionBid',
  'AuctionDurationExtended',
  'AuctionEnded',
  'AuctionCanceled',
]

// topic0 -> event name, computed rather than hardcoded so it can't drift from the fragments.
const AUCTION_TOPICS = {}
const AUCTION_TOPIC_BY_NAME = {}
for (const name of AUCTION_EVENT_NAMES) {
  const topic = auctionHouseInterface.getEventTopic(name)
  AUCTION_TOPICS[topic] = name
  AUCTION_TOPIC_BY_NAME[name] = topic
}

const TRANSFER_TOPIC = utils.id('Transfer(address,address,uint256)')

/**
 * Our eight token ids as 32-byte log topics.
 *
 * This is the load-bearing difference from a single-collection archive. Zora Media V1
 * is shared, so filtering AuctionHouse logs on tokenContract alone returns every
 * auction anyone ever ran on it (16,026 logs). Adding this to the tokenId topic
 * position brings it to 156.
 */
const TOKEN_ID_TOPICS = TOKEN_IDS.map((id) =>
  utils.hexZeroPad(utils.hexlify(utils.parseUnits(id, 0)), 32)
)

/**
 * Zora Media V1 accessors. Unlike a plain ERC-721 this contract splits content from
 * metadata — two URIs, two CIDs — and, crucially, stores the sha256 of each on chain.
 * Those two hashes are what make this archive provable rather than merely plausible.
 *
 * Selectors verified by eth_call against token 3366 on mainnet.
 */
const SELECTORS = {
  name: '0x06fdde03',
  symbol: '0x95d89b41',
  ownerOf: '0x6352211e',
  tokenURI: '0xc87b56dd',
  tokenMetadataURI: '0x157c3df9',
  tokenContentHashes: '0xfad32197',
  tokenMetadataHashes: '0x01ddc3b5',
  tokenCreators: '0xe0fd045f',
}

const encodeUint = (n) => utils.hexZeroPad(utils.hexlify(utils.parseUnits(String(n), 0)), 32).slice(2)
const encodeCall = (selector, tokenId) => selector + encodeUint(tokenId)

/** Decode an ABI-encoded `string` return value. Returns null for empty/short data. */
function decodeString(hex) {
  if (!hex || hex === '0x' || hex.length < 130) return null
  try {
    return utils.defaultAbiCoder.decode(['string'], hex)[0]
  } catch (e) {
    return null
  }
}

function decodeAddress(hex) {
  if (!hex || hex.length < 66) return null
  return utils.getAddress('0x' + hex.slice(-40))
}

/** Decode a bytes32 return value to a bare lowercase hex digest, no 0x prefix. */
function decodeBytes32(hex) {
  if (!hex || hex.length < 66) return null
  return hex.slice(2, 66).toLowerCase()
}

module.exports = {
  AUCTION_HOUSE_EVENTS,
  auctionHouseInterface,
  AUCTION_EVENT_NAMES,
  AUCTION_TOPICS,
  AUCTION_TOPIC_BY_NAME,
  TRANSFER_TOPIC,
  TOKEN_ID_TOPICS,
  SELECTORS,
  encodeCall,
  decodeString,
  decodeAddress,
  decodeBytes32,
}
