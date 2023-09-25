import Head from "../../components/head";
import GoHome from "../../components/go-home";
import find from "lodash/find";
import { NFTFullPage, MediaConfiguration } from "@zoralabs/nft-components";
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
  return (
    <>
      <Head
        title={post.title}
        description={post?.description}
        ogImage={post?.image}
      />
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
  return {
    props: {
      post,
    },
  };
}

export default Doge;
