import Head from '../components/head'
import Image from 'next/image'
import Link from 'next/link'
import characterRandomColor from '../scripts/characterRandomColor'

import DogeCard from '../components/doge-nft-card'
import DogeHead from '../components/doge-head'

const API_URL = process.env.WORDPRESS_API_URL

export default function Index({ data, title }) {
  return (
    <>
      <Head title="Home" />
      <div className="doge-home_sidebar">
        <DogeHead/>
        <div className="doge-home_title">
          <h1 className="text-04" dangerouslySetInnerHTML={{ __html: title }} />
          <p className="text-02 doge-home_intro" dangerouslySetInnerHTML={{ __html: data.options.intro_copy }} />
        </div>
        <div className="doge-home_ui">
          <Link href={'/doge-history'}>
            <a className="lozenge-button doge-home_history-button">Doge History</a>
          </Link>
        </div>
      </div>
      <section className="doge-home_wrapper">
        <div className="doge-home_border" />
        <nav className="doge-home_nav-wrapper">
          <div className="doge-home_hero">
            <div className="doge-home_hero-inner">
              <DogeCard doge={data.options.main_doge} />
            </div>
          </div>
          {data.options.doge_list.map(
            (item, i) => (
              <div className="doge-home_grid-item" key={`${item.id}-${i}`}>
                <DogeCard doge={item}/>
              </div>
            )
          )}
        </nav>
      </section>
    </>
  )
};

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
  
  const title = characterRandomColor('good doge', 'span', 'doge-title');
  return {
    props: { data, title },
  }
}
