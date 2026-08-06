import { MediaConfiguration } from '@zoralabs/nft-components'

import Head from '../../components/head'
import GoHome from '../../components/go-home'
import DogeFooter from '../../components/doge-footer'
import SnapshotProvider from '../../components/nft-data/snapshot-provider'
import DogeNftFull from '../../components/nft-data/doge-nft-full'
import { FULL_PAGE_STYLE } from '../../lib/media-theme'
import { getSnapshotMeta, getTokenBySlug, getTokenSlugs } from '../../lib/snapshot'

const Doge = ({ token, meta }) => (
  <>
    <Head
      title={token.metadata.name}
      description={token.metadata.description}
      ogImage={token.media.ogImageSrc}
      ogImageWidth={token.media.width}
      ogImageHeight={token.media.height}
    />
    <GoHome />
    <article className="doge-nft_wrapper">
      {/*
        networkId is explicit so ProofAuthenticity's
        VIEW_ETHERSCAN_URL_BASE_BY_NETWORK[networkId] lookup is deliberate rather than
        relying on the context default.
      */}
      <MediaConfiguration networkId="1" style={FULL_PAGE_STYLE}>
        <SnapshotProvider token={token} meta={meta}>
          <DogeNftFull token={token} />
        </SnapshotProvider>
      </MediaConfiguration>
    </article>
    <DogeFooter location="product" />
  </>
)

export async function getStaticPaths() {
  return {
    paths: getTokenSlugs().map((id) => ({ params: { id } })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const meta = getSnapshotMeta()
  return {
    props: {
      token: getTokenBySlug(params.id),
      // Only what the shim reads. The rest of meta is provenance.
      meta: {
        contractName: meta.contractName,
        contractSymbol: meta.contractSymbol,
        auctionHouse: meta.auctionHouse,
      },
    },
  }
}

export default Doge
