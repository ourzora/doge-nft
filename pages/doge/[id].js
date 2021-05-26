import Head from '../../components/head'
import GoHome from '../../components/go-home'
import find from 'lodash/find'
import Image from 'next/image'
import { css } from '@emotion/css'
// import { useNFT, useNFTMetadata } from "@zoralabs/nft-hooks"
import { NFTFullPage, FullComponents, NFTPageWrapper, MediaConfiguration } from "@zoralabs/nft-components"

import DogeFooter from '../../components/doge-footer'

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
/*
const NFTFullPage = ({id}) => {
  return (
    <NFTPageWrapper id={id}>
      <FullComponents.MediaInfo />
      <FullComponents.PlaceOfferButton />
      <FullComponents.AuctionInfo />
      <FullComponents.ProofAuthenticity />
      <FullComponents.BidHistory />
      <FullComponents.CreatorEquity />
    </NFTPageWrapper>
  );
};
*/

const Doge = ({ post }) => {
  return (
    <>
      <Head title={`${post.title}`} />
      <GoHome />
      <article className="doge-nft_wrapper">
        <MediaConfiguration style={style}>
          <NFTFullPage
            id={post.nft_id}
            showFull={true}
          />
        </MediaConfiguration>
      </article>
      <DogeFooter location="product"/>
    </>
  ) 
}

const API_URL = process.env.WORDPRESS_API_URL

export async function getStaticPaths() {
  const res = await fetch(API_URL)
  const posts = await res.json()

  const paths = posts.options.doge_list.map((post) => ({
    params: { id: post.slug },
  }))

  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const res = await fetch(API_URL)
  const data = await res.json()

  const post = find(data.options.doge_list, { slug: params.id })

  return {
    props: { post },
  }
}

export default Doge
