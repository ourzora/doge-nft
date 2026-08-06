import { InfoContainer } from '@zoralabs/nft-components/dist/nft-full/InfoContainer'
import { AddressView } from '@zoralabs/nft-components/dist/components/AddressView'
import { useMediaContext } from '@zoralabs/nft-components/dist/context/useMediaContext'

/**
 * Stands in for FullComponents.AuctionInfo's "complete" branch.
 *
 * Identical markup and class names — it goes through the same InfoContainer and the
 * same getStyles keys — but reads the precomputed sale.soldAmountLabel instead of
 * running PricingString. PricingString formats with
 * `Intl.NumberFormat(typeof window === "undefined" ? "en-US" : navigator.language)`,
 * so with the data present at SSR it renders "1,696.9" on the server and "1.696,9"
 * for a de-DE visitor, and React 18 throws away the server HTML for the subtree.
 */
const SoldFor = ({ token, className }) => {
  const { getStyles, getString } = useMediaContext()
  const { sale } = token
  if (!sale || sale.status !== 'sold') return null

  return (
    // `doge-sold-for` centres the amount and the winner address. AuctionInfo's own
    // markup relies on `.zora-fullInfoAuctionWrapper` for that, which is a 0.3.x class
    // 1.2.1 no longer emits — its style entry is still in the map but returns an empty
    // string and nothing calls it.
    <InfoContainer titleString="AUCTION_SOLD_FOR" className={`doge-sold-for ${className || ''}`.trim()}>
      <div {...getStyles('fullInfoAuctionPricing')}>
        <span {...getStyles('pricingAmount')}>{sale.soldAmountLabel}</span>
      </div>
      <div {...getStyles('fullInfoSpacer', undefined, { width: 15 })} />
      <div {...getStyles('fullLabel')}>{getString('WINNER')}</div>
      <AddressView address={sale.winner} />
    </InfoContainer>
  )
}

export default SoldFor
