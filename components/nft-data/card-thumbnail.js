import { useMediaContext } from '@zoralabs/nft-components/dist/context/useMediaContext'

import MediaImage from './media-image'

/**
 * Stands in for PreviewComponents.MediaThumbnail.
 *
 * Identical markup and class names, with one change: the creator line renders the
 * truncated address as a <span> rather than the <a> AddressView produces.
 *
 * Every card is wrapped in a next/link <a> (see doge-cards.js), and an <a> inside an
 * <a> is invalid HTML. The parser hoists the inner one out, so the DOM the browser
 * builds does not match what React rendered, hydration fails, and React 18 throws
 * away the server HTML and re-renders the whole root on the client.
 *
 * This was latent rather than new: MediaThumbnail has always rendered AddressView
 * inside the card link, but before the archive there was no data, so `address` was
 * undefined and AddressView returned a bare "..." with no anchor. Supplying real data
 * is what made the nesting appear.
 *
 * Nothing is lost visually — scss/_doge-cards.scss has `.zora-cardItemInfo div
 * { display: none }`, so this line is hidden by design and only the title shows.
 */
const PREFIX_LENGTH = 2 // "0x"
const SHOW_CHARS = 6

const truncateAddress = (address) =>
  `${address.slice(0, SHOW_CHARS + PREFIX_LENGTH)}...${address.slice(-SHOW_CHARS)}`

const CardThumbnail = ({ token, className }) => {
  const { getStyles, getString } = useMediaContext()
  const address = token.creator

  return (
    <div className={className}>
      <div {...getStyles('cardMediaWrapper')}>
        <MediaImage token={token} />
      </div>
      <div {...getStyles('cardItemInfo')}>
        <h5 {...getStyles('cardTitle')}>{token.metadata.name}</h5>
        <div>
          <span {...getStyles('textSubdued')}>{getString('CARD_CREATED_BY')}</span>{' '}
          <span>
            <span {...getStyles('addressLink')}>
              <span>{truncateAddress(address)}</span>
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

export default CardThumbnail
