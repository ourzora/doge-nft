import { useContext } from 'react'
import Head from '../../components/head'
import GoHome from '../../components/go-home'
import find from 'lodash/find'
import { NFTFullPage, MediaConfiguration, NFTDataContext } from "@zoralabs/nft-components"

import DogeFooter from '../../components/doge-footer'

import { NFT_LIST } from '../../lib/constants'

export const style = {
  theme: {
    previewCard: {
      background: "linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 100%), #696969",
    },
    titleFont: {
      color: "var(--black)",
      fontWeight: 400,
      fontSize: 'var(--text-02)',
      fontFamily: 'var(--font)'
    },
    bodyFont: {
      color: "var(--blue)",
      fontWeight: 300,
      fontSize: 'var(--text-02)',
      fontFamily: 'var(--font)'
    },
    defaultBorderRadius: 20
  }
};

const Doge = ({ post }) => {
  return (
    <>
      <Head title={`${post.title}`} />
      <GoHome />
      <article className="doge-nft_wrapper">
        <MediaConfiguration style={style}>
          <NFTFullPage id={post.id}></NFTFullPage>
        </MediaConfiguration>
      </article>
      <DogeFooter location="product"/>
    </>
  ) 
}

export async function getStaticPaths() {
  const paths = NFT_LIST.map((nft) => ({
    params: { id: nft.slug },
  }))
  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const post = find(NFT_LIST, { slug: params.id })
  return {
    props: { post },
  }
}

export default Doge
