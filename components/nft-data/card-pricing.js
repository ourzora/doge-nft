import { useMediaContext } from '@zoralabs/nft-components/dist/context/useMediaContext'

/**
 * Stands in for PreviewComponents.PricingComponent's "reserve-finished" branch —
 * the only branch a settled auction can reach.
 *
 * Same markup, same style keys, but the amount is the precomputed label rather than
 * a runtime Intl.NumberFormat. See sold-for.js for why that matters.
 */
const CardPricing = ({ token, className }) => {
  const { getStyles, getString } = useMediaContext()
  const { sale } = token
  if (!sale || sale.status !== 'sold') return null

  return (
    <div {...getStyles('cardAuctionPricing', className, { type: 'reserve-finished' })}>
      <span {...getStyles('textSubdued')}>{getString('SOLD_FOR')}</span>
      <span {...getStyles('pricingAmount')}>
        <span {...getStyles('pricingAmount')}>{sale.soldAmountLabel}</span>
      </span>
    </div>
  )
}

export default CardPricing
