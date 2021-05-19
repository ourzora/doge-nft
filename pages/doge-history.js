import Head from '../components/head'
import GoHome from '../components/go-home'

const API_URL = process.env.WORDPRESS_API_URL

const DogeHistory = ({data}) => {
  return (
    <section>
      <Head title="ABOUT DOGE" />
      <GoHome />
      <article className="doge-history_wrapper">
        <h1 className="title-pill">Doge-Story</h1>
        <div className="doge-copy text-03" dangerouslySetInnerHTML={{ __html: data.options.about_copy }}/>
      </article>
      <aside className="doge-history_bg"></aside>
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
