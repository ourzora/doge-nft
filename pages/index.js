import Head from '../components/head'
import Link from 'next/link'
import characterRandomColor from '../scripts/characterRandomColor'

import DogeCard from '../components/doge-nft-card'
import DogeHead from '../components/doge-head'
import DogeFooter from '../components/doge-footer'

const API_URL = process.env.WORDPRESS_API_URL

export default function Index({ data, title }) {
  return (
    <>
      <Head title="Home" />
      <div className="doge-sidebar_wrapper">
        <div className="doge-sidebar_inner">
          <DogeHead />
          <div className="doge-sidebar_title">
            <h1 className="text-04" dangerouslySetInnerHTML={{ __html: title }} />
            <p className="text-02 doge-sidebar_intro" dangerouslySetInnerHTML={{ __html: data.options.intro_copy }} />
          </div>
          <div className="doge-sidebar_ui">
            <Link href={'/doge-history'}>
              <a className="lozenge-button doge-sidebar_history-button">Doge History</a>
            </Link>
          </div>
        </div>
      </div>
      <section className="doge-home_wrapper">
        <div className="doge-home_border" />
        <nav className="doge-home_nav-wrapper">
          {/*<div className="doge-home_hero">
            <div className="doge-home_hero-inner">
              <DogeCard doge={data.options.main_doge} />
            </div>
  </div>*/}
          {data.options.doge_list.map(
            (item, i) => (
              <div className="doge-home_grid-item" key={`${item.id}-${i}`}>
                <DogeCard doge={item}/>
              </div>
            )
          )}
        </nav>
      </section>
      <DogeFooter location="index"/>
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
