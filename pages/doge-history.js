import Head from '../components/head'
import GoHome from '../components/go-home'
import AboutCopy from '../components/about-copy'
import Image from 'next/image'

const API_URL = process.env.WORDPRESS_API_URL

const DogeHistory = ({data}) => {
  return (
    <section>
      <Head title="ABOUT DOGE" />
      <GoHome />
      <AboutCopy />
      <aside className="doge-history_bg"></aside>
      <div className="doge-history_kym">
        <p>Written and prepared by Know Your Meme</p>s
        <div className="doge-history_kym-logo">
          <Image
            src={'/about-pictures/know-your-meme-logo.png'}
            layout="fill"
            objectFit="contain"
          />
        </div>
      </div>
    </section>
  )
}

export async function getStaticProps() {
  const res = await fetch(API_URL)
  const data = await res.json()

  if (!data) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }

  return {
    props: { data },
  }
}

export default DogeHistory
