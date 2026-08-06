import Head from '../components/head'
import DogeCards from '../components/doge-cards'
import DogeFooter from '../components/doge-footer'
import DogeSidebar from '../components/doge-sidebar'
import ZoraKymCard from '../components/zora-kym-card'
import { DEFAULT_DESCRIPTION } from '../lib/constants'
import { getAllTokens, getSnapshotMeta } from '../lib/snapshot'

export default function Index({ tokens, meta }) {
  return (
    <>
      <Head title="Doge NFT Auction" description={DEFAULT_DESCRIPTION} />
      <DogeSidebar />
      <section className="doge-home_wrapper">
        <div className="doge-home_border" />
        <nav className="doge-home_nav-wrapper">
          <DogeCards tokens={tokens} meta={meta} />
          <ZoraKymCard />
        </nav>
      </section>
      <DogeFooter location="index hide-mobile" />
    </>
  )
}

export async function getStaticProps() {
  const meta = getSnapshotMeta()
  return {
    props: {
      tokens: getAllTokens(),
      // Only what the shim reads. The rest of meta is provenance.
      meta: {
        contractName: meta.contractName,
        contractSymbol: meta.contractSymbol,
        auctionHouse: meta.auctionHouse,
      },
    },
  }
}
