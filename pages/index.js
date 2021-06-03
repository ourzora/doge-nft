import Head from '../components/head'
import DogeCards from '../components/doge-cards'
import DogeFooter from '../components/doge-footer'
import DogeSidebar from '../components/doge-sidebar'
import ZoraKymCard from '../components/zora-kym-card'

export default function Index({ data }) {
  return (
    <>
      <Head
        title="Doge NFT Auction"
        description="The original Doge memes are being auctioned off as 1/1 NFTs for charity. Own these pieces of internet history. Brought to you by Atsuko Sato and Kabosu."
      />
      <DogeSidebar/>
      <section className="doge-home_wrapper">
        <div className="doge-home_border" />
        <nav className="doge-home_nav-wrapper">
          <DogeCards/>
          <ZoraKymCard/>
        </nav>
      </section>
      <DogeFooter location="index hide-mobile"/>
    </>
  )
};
