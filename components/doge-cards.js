import Link from 'next/link'
import { MediaConfiguration } from '@zoralabs/nft-components'
import { MediaThumbnailWrapper } from '@zoralabs/nft-components/dist/nft-preview/MediaThumbnailWrapper'

import SnapshotProvider from './nft-data/snapshot-provider'
import CardThumbnail from './nft-data/card-thumbnail'
import CardPricing from './nft-data/card-pricing'
import { CARD_STYLE } from '../lib/media-theme'

/**
 * What NFTPreview renders, minus its data provider — MediaThumbnailWrapper wrapping
 * MediaThumbnail plus the pricing line. Keeping MediaThumbnailWrapper matters: it
 * emits `.zora-cardOuter`, which scss/_doge-cards.scss builds the whole card layout
 * on, and its auctionStatus flag comes from the market we supply through the shim.
 *
 * Previously every card mounted its own NFTPreview, so the index page fired eight
 * separate failing fetches at the dead indexer on load.
 */
const DogeCard = ({ token, meta }) => (
  <Link href={`/doge/${token.slug}`} className="doge-card_wrapper shadow">
    <div className="doge-card_wrapper-inner">
      <SnapshotProvider token={token} meta={meta}>
        <MediaThumbnailWrapper className="doge-card">
          <CardThumbnail token={token} />
          <CardPricing token={token} />
        </MediaThumbnailWrapper>
      </SnapshotProvider>
    </div>
  </Link>
)

const DogeCards = ({ tokens, meta }) => (
  <MediaConfiguration networkId="1" style={CARD_STYLE}>
    {tokens.map((token) => (
      <div className="doge-cards_list-item" key={token.tokenId}>
        <DogeCard token={token} meta={meta} />
      </div>
    ))}
  </MediaConfiguration>
)

export default DogeCards
