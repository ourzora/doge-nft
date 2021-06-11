import Head from "../../components/head";
import GoHome from "../../components/go-home";
import find from "lodash/find";
import { NFTFullPage, MediaConfiguration } from "@zoralabs/nft-components";
import { MediaFetchAgent, Networks } from "@zoralabs/nft-hooks";

import DogeFooter from "../../components/doge-footer";

import { NFT_LIST } from "../../lib/constants";

export const style = {
  theme: {
    titleFont: {
      fontWeight: 300,
      fontSize: "var(--text-02)",
      fontFamily: "var(--font)",
    },
    bodyFont: {
      color: "var(--blue)",
      fontSize: "var(--text-02)",
      fontWeight: 300,
      fontFamily: "var(--font)",
    },
    defaultBorderRadius: 20,
  },
};

export const strings = {
  OPEN_OFFERS: "",
};

const Doge = ({ post, nftData }) => {
  const config = {
    allowOffer: true,
    showPerpetual: false,
    refreshInterval: 45,
  };
  return (
    <>
      <Head
        title={post.title}
        description={nftData.description}
        ogImage={`${nftData.zoraNFT.contentURI}`}
      />
      <GoHome />
      <article
        className={`doge-nft_wrapper ${!post.auctionState ? "hide" : ""}`}
      >
        <MediaConfiguration style={style} strings={strings}>
          <NFTFullPage id={post.id} config={config} />
        </MediaConfiguration>
      </article>
      <DogeFooter location="product" />
    </>
  );
};

export async function getStaticPaths() {
  const paths = NFT_LIST.map((nft) => ({
    params: { id: nft.slug },
  }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const post = find(NFT_LIST, { slug: params.id });
  const fetcher = new MediaFetchAgent(Networks.MAINNET);

  const nft = await fetcher.loadZNFTData(post.id);
  const metadata = await fetcher.fetchIPFSMetadata(nft.nft.metadataURI);

  function prepareJson(json) {
    return JSON.parse(JSON.stringify(json));
  }

  const nftData = prepareJson({
    ...nft,
    ...metadata,
  });

  return {
    props: {
      post,
      nftData,
    },
  };
}

export default Doge;
