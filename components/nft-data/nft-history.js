import { InfoContainer } from '@zoralabs/nft-components/dist/nft-full/InfoContainer'
import { AddressView } from '@zoralabs/nft-components/dist/components/AddressView'
import { useMediaContext } from '@zoralabs/nft-components/dist/context/useMediaContext'

/**
 * Stands in for FullComponents.BidHistory.
 *
 * Same rows, same order, same markup and class names. The difference is where the
 * date text comes from: BidHistory calls
 * `toLocaleString("en-US", {month:"long", day:"numeric", hour:"2-digit", minute:"2-digit", year:"numeric", hour12:true})`,
 * which pins the locale but NOT the timezone. Rendered at build time on a UTC machine
 * and rehydrated in someone's browser in Los Angeles, the two strings differ and
 * React 18 discards the server HTML for the subtree. Here the label is computed once
 * at snapshot time, in UTC, and labelled as such.
 *
 * Rows are built from the snapshot directly rather than reassembled out of the
 * context, which is a good deal easier to follow than BidHistory's three-source merge.
 * The context is still populated equivalently by lib/zora-shim.js, so swapping the
 * stock component back in is a one-line change.
 */
const HistoryRow = ({ actor, description, amountLabel, dateLabel, isoTimestamp, transactionHash }) => {
  const { getStyles, getString, style } = useMediaContext()

  return (
    <li {...getStyles('fullPageHistoryItem')}>
      <div {...getStyles('fullPageHistoryItemDescription')}>
        <div {...getStyles('fullPageHistoryItemDescriptionCopy')}>
          <AddressView address={actor} />
          &nbsp;
          <span {...getStyles('pricingAmount')}>
            {description}{' '}
            {amountLabel && <span {...getStyles('pricingAmount')}>{amountLabel}</span>}
          </span>
        </div>
        {transactionHash && style.theme.showTxnLinks && (
          <a
            {...getStyles('fullPageHistoryTxnLink')}
            href={`https://etherscan.io/tx/${transactionHash}`}
            target="_blank"
            rel="noreferrer"
          >
            {getString('BID_HISTORY_VIEW_TRANSACTION')}
          </a>
        )}
      </div>
      <div {...getStyles('fullPageHistoryItemMeta')}>
        <time dateTime={isoTimestamp} {...getStyles('fullPageHistoryItemDatestamp')}>
          {dateLabel}
        </time>
      </div>
    </li>
  )
}

const NftHistory = ({ token, className }) => {
  const { getStyles, getString } = useMediaContext()
  const { sale, mint } = token
  if (!sale || sale.status !== 'sold') return null

  const rows = [
    {
      key: 'won',
      actor: sale.winner,
      description: getString('AUCTION_SOLD_FOR'),
      amountLabel: sale.soldAmountLabel,
      dateLabel: sale.soldDateTimeLabel,
      isoTimestamp: sale.expectedEndIso,
      transactionHash: sale.finalizedAtTx,
    },
    ...sale.bids.map((bid) => ({
      key: `bid-${bid.id}`,
      actor: bid.bidder,
      description: getString('BID_HISTORY_BID'),
      amountLabel: bid.amountLabel,
      dateLabel: bid.dateTimeLabel,
      isoTimestamp: bid.isoTimestamp,
      transactionHash: bid.transactionHash,
    })),
    {
      key: 'approved',
      actor: sale.curator,
      description: getString('BID_HISTORY_AUCTION_APPROVED'),
      dateLabel: sale.approvedAtLabel,
      isoTimestamp: sale.approvedAtIso,
      transactionHash: sale.approvedAtTx,
    },
    {
      key: 'created',
      actor: sale.tokenOwner,
      description: getString('BID_HISTORY_CREATED_AUCTION'),
      amountLabel: sale.reservePriceLabel,
      dateLabel: sale.createdAtLabel,
      isoTimestamp: sale.createdAtIso,
      transactionHash: sale.createdAtTx,
    },
    {
      key: 'minted',
      actor: token.creator,
      description: getString('BID_HISTORY_MINTED'),
      dateLabel: mint.dateTimeLabel,
      isoTimestamp: mint.isoTimestamp,
      transactionHash: mint.transactionHash,
    },
  ]

  // Newest first, matching BidHistory. Ties are impossible: the snapshot puts
  // logIndex in the milliseconds field precisely so same-block bids stay ordered.
  rows.sort((a, b) => new Date(b.isoTimestamp) - new Date(a.isoTimestamp))

  return (
    <InfoContainer titleString="NFT_HISTORY" className={className}>
      <ol {...getStyles('fullPageHistoryList')}>
        {rows.map(({ key, ...row }) => (
          <HistoryRow key={key} {...row} />
        ))}
      </ol>
    </InfoContainer>
  )
}

export default NftHistory
