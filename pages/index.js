import Head from '../components/head'
import DogeCards from '../components/doge-cards'
import DogeSidebar from '../components/doge-sidebar'
import ZoraKymCard from '../components/zora-kym-card'

export default function Index({ data }) {
  return (
    <>
      <Head
        title="Hi."
      />
      <DogeSidebar/>
      <section className="doge-home_wrapper">
        <div className="doge-home_border" />
        <nav className="doge-home_nav-wrapper">
          <DogeCards/>
        </nav>
      </section>
      
    </>
  )
};
