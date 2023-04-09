import Head from "../../components/head";
import GoHome from "../../components/go-home";
import find from "lodash/find";
import { NFTFullPage, MediaConfiguration, FullComponents, NFTDataProvider } from "@derpyvision/doge-nft-components";
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
    useCollectionTag: false
  },
};

export const strings = {
  OPEN_OFFERS: "",
};

const Doge = ({ post }) => {
  const config = {
    allowOffer: false,
    showPerpetual: false,
    refreshInterval: false,
  };

  // console.log(nftData?.description)

  /*
    description
  : 
  "One of the many classic photographs of the Shiba Inu “Kabosu,” this image was taken by her owner Atsuko Sato on February 13th, 2010, before going on to become an iconic meme throughout the 2010s. Snapped back when Kabosu was just a few years old during an impromptu photoshoot, this picture captures a rare side of the beloved Shiba behind the Doge meme."
  mimeType
  : 
  "image/png"
  name
  : 
  "Curious Doge"
  */

  return (
    <>
      {/*
      <Head
        title={post.title}
        description={nftData.description}
        ogImage={`${nftData.zoraNFT.contentURI}`}
      />
       */}
      <GoHome />
      <article
        className={`doge-nft_wrapper`}
      >
        <MediaConfiguration
          style={style}
          strings={strings}
        >
          <NFTFullPage
            contract="0xabEFBc9fD2F806065b4f3C237d4b59D9A97Bcac7"
            id={post.id}
            config={config}
          />
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

  // const nft = await fetcher.loadZNFTData(post.id);
  // const metadata = await fetcher.fetchIPFSMetadata(nft.nft.metadataURI);
  /*
  console.log(nft)

  function prepareJson(json) {
    return JSON.parse(JSON.stringify(json));
  }

  const nftData = prepareJson({
    ...nft,
    ...metadata,
  });
  */
  return {
    props: {
      post,
      // nftData,
    },
  };
}

export default Doge;
