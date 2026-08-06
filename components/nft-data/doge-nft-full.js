import { FullComponents } from '@zoralabs/nft-components'
import { useMediaContext } from '@zoralabs/nft-components/dist/context/useMediaContext'

import MediaImage from './media-image'
import NftHistory from './nft-history'
import SoldFor from './sold-for'

/**
 * What NFTFullPage renders, minus its data provider.
 *
 * The wrapper divs matter: scss/_doge-nft.scss sizes `.zora-fullPage` and
 * `.zora-fullPageDataGrid`, so they have to come from the same getStyles keys rather
 * than being replaced with our own markup.
 *
 * MediaFull is replaced by a wrapper plus media-image.js, and three of NFTFullPage's
 * children are dropped:
 *   PlaceOfferButton — ignores config.allowOffer and unconditionally renders a
 *                      zora.co/collections link that no longer resolves
 *   CreatorEquity    — only renders for an active auction
 *   CollectionTag    — already gated off by theme.useCollectionTag
 * and two are swapped for local equivalents that read precomputed strings; see
 * sold-for.js and nft-history.js.
 *
 * a11yIdPrefix is passed explicitly. NFTFullPage derives it from useA11yIdPrefix,
 * which is backed by a module-level counter — it keeps incrementing across the pages
 * rendered in one build process but restarts at 0 in the browser, so the resulting
 * aria-describedby does not survive hydration. A value derived from the token id is
 * stable on both sides.
 */
const DogeNftFull = ({ token }) => {
  const { getStyles } = useMediaContext()
  const a11yIdPrefix = `doge-${token.tokenId}-`

  return (
    <div {...getStyles('fullPage')}>
      {/* MediaFull's only job is this wrapper plus a MediaObject; see media-image.js
          for why the latter cannot render a server-side image. */}
      <div {...getStyles('fullMediaWrapper')}>
        <MediaImage token={token} isFullPage a11yIdPrefix={a11yIdPrefix} />
      </div>
      <div {...getStyles('fullPageDataGrid')}>
        <FullComponents.MediaInfo a11yIdPrefix={a11yIdPrefix} />
        <FullComponents.NFTProperties />
        <SoldFor token={token} />
        <FullComponents.ProofAuthenticity />
        <NftHistory token={token} />
      </div>
    </div>
  )
}

export default DogeNftFull
