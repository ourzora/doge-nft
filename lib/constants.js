/**
 * The only token data with no on-chain source.
 *
 * Order defines the grid order on the index page — index 0 is the hero card — and
 * slug defines the URL. Both predate the archive and must not change. Everything
 * else about a token (title, description, image, sale) now comes from
 * snapshot/mainnet.json; see lib/snapshot.js.
 *
 * scripts/snapshot/config.js keeps a CommonJS copy of this list, because the
 * snapshot scripts must not depend on the app's module graph. The two are checked
 * against each other whenever the snapshot is rebuilt.
 */
export const TOKEN_SLUGS = [
  { tokenId: '3366', slug: 'doge' },
  { tokenId: '3367', slug: 'feisty-doge' },
  { tokenId: '3368', slug: 'yelling-doge' },
  { tokenId: '3369', slug: 'curious-doge' },
  { tokenId: '3370', slug: 'angry-doge' },
  { tokenId: '3371', slug: 'shocked-doge' },
  { tokenId: '3372', slug: 'sad-doge' },
  { tokenId: '3373', slug: 'cuddly-doge' },
]

export const SITE_URL = 'https://very.auction'

export const INTRO_COPY = `The original Doge memes were auctioned off as 1/1 NFTs for charity in June 2021. This is a record of those auctions.<br></br>Brought to you by the memes original creators: Atsuko Sato and Kabosu.`

export const DEFAULT_DESCRIPTION = `Doge NFT Auction, an archive. The original Doge memes were auctioned off as 1/1 NFTs for charity in June 2021. Brought to you by Atsuko Sato and Kabosu`
