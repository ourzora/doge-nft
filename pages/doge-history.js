import Head from '../components/head'
import GoHome from '../components/go-home'
import AboutCopy from '../components/about-copy'
import Image from 'next/image'
import DogeFooter from '../components/doge-footer'

const DogeHistory = () => {
  return (
    <>
      <Head title="ABOUT DOGE" />
      <GoHome />
      <AboutCopy />
      <aside className="doge-history_bg"></aside>
      <a href="https://knowyourmeme.com/" target="_blank" className="doge-history_kym">
        <p>Written and prepared by Know Your Meme</p>
        <div className="doge-history_kym-logo">
          <Image
            src={'/about-pictures/know-your-meme-logo.png'}
            layout="fill"
            objectFit="contain"
          />
        </div>
      </a>
      <DogeFooter location="history"/>
    </>
  )
}

export default DogeHistory
