// Standalone config for the snapshot scripts. Nothing here imports from the app —
// these run as plain CommonJS under `node`, with no Next env loaded and no bundler.

const NETWORK_ID = '1'

// Zora Media V1. Note this is a SHARED, multi-tenant contract: it holds hundreds of
// thousands of tokens minted by everyone who ever used Zora V1, of which the eight
// below are ours. Every log scan must therefore filter by token id — the
// "scan the whole contract's Transfer history" shortcut is not available here.
const CONTRACT = '0xabEFBc9fD2F806065b4f3C237d4b59D9A97Bcac7'
const AUCTION_HOUSE = '0xE468cE99444174Bd3bBBEd09209577d25D1ad673'

// All eight were minted in one batch. Verified: no Transfer log for any of these
// token ids exists before this block.
const DEFAULT_FROM_BLOCK = 12545032

// Leave a margin below head so a re-run isn't tripped up by a reorg.
const REORG_MARGIN = 12

/**
 * The one piece of token data with no on-chain source. Order defines the grid order
 * on the index page — index 0 is the hero card — and slug defines the URL, both of
 * which predate this snapshot and must not change.
 *
 * Kept as a CommonJS duplicate of lib/constants.js TOKEN_SLUGS rather than imported,
 * because these scripts must not depend on the app's module graph. index.js checks
 * the two agree.
 */
const TOKEN_SLUGS = [
  { tokenId: '3366', slug: 'doge' },
  { tokenId: '3367', slug: 'feisty-doge' },
  { tokenId: '3368', slug: 'yelling-doge' },
  { tokenId: '3369', slug: 'curious-doge' },
  { tokenId: '3370', slug: 'angry-doge' },
  { tokenId: '3371', slug: 'shocked-doge' },
  { tokenId: '3372', slug: 'sad-doge' },
  { tokenId: '3373', slug: 'cuddly-doge' },
]

const TOKEN_IDS = TOKEN_SLUGS.map((t) => t.tokenId)

// Absolute base for og:image. Crawlers do not resolve relative og:image URLs, so this
// is baked into the snapshot — a domain change is then a regeneration, not a code edit.
const SITE_URL = 'https://very.auction'

// Keyless endpoints, split by capability. Measured behaviour (unchanged from the
// holly-plus restoration, re-confirmed against this contract):
//  - tenderly: archive eth_getLogs with unlimited block range, but throttles JSON-RPC batches
//  - publicnode: refuses ALL archive requests, but serves `latest` eth_call and batches of 20
//  - drpc: historical eth_call/eth_getCode OK, eth_getLogs capped at 10k blocks, 403s without a UA
const RPC = {
  logs: ['https://gateway.tenderly.co/public/mainnet'],
  logsChunked: ['https://eth.drpc.org'],
  archive: ['https://eth.drpc.org', 'https://gateway.tenderly.co/public/mainnet'],
  batch: ['https://ethereum-rpc.publicnode.com', 'https://eth.drpc.org'],
}

/**
 * Tried in order, sequentially, per CID.
 *
 * These sixteen CIDs are in far better shape than holly-plus's were — all of them
 * still resolve on ipfs.io, which is why it goes first. The rest are fallbacks for a
 * bad day: one HEAD returned a 500 during research even though the GET succeeded.
 *
 * ipfs.fleek.co, the gateway baked into this contract's on-chain tokenURI, is gone,
 * as is zora-prod.mypinata.cloud, the one @zoralabs/nft-hooks hardcodes.
 */
const GATEWAYS = [
  { base: 'https://ipfs.io/ipfs/', headers: {} },
  { base: 'https://dweb.link/ipfs/', headers: {} },
  { base: 'https://ipfs.filebase.io/ipfs/', headers: {} },
  { base: 'https://w3s.link/ipfs/', headers: {} },
  { base: 'https://nftstorage.link/ipfs/', headers: {} },
  { base: 'https://trustless-gateway.link/ipfs/', headers: { Accept: 'application/vnd.ipld.raw' } },
]

// The gateway recorded in the snapshot for provenance links. Nothing at runtime
// fetches from it — every byte the site renders is committed under public/media.
const CANONICAL_GATEWAY = 'https://ipfs.io/ipfs/'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const ETH_CURRENCY = {
  id: ZERO_ADDRESS,
  name: 'Ether',
  symbol: 'ETH',
  decimals: 18,
}

const USER_AGENT = 'doge-nft-snapshot/1.0'

const paths = {
  snapshot: 'snapshot/mainnet.json',
  overrides: 'scripts/snapshot/overrides',
  media: 'public/media',
  cache: '.media-cache',
}

module.exports = {
  NETWORK_ID,
  CONTRACT,
  AUCTION_HOUSE,
  DEFAULT_FROM_BLOCK,
  REORG_MARGIN,
  TOKEN_SLUGS,
  TOKEN_IDS,
  SITE_URL,
  RPC,
  GATEWAYS,
  CANONICAL_GATEWAY,
  ZERO_ADDRESS,
  ETH_CURRENCY,
  USER_AGENT,
  paths,
}
