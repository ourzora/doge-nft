import Head from '../components/head'
import GoHome from '../components/go-home'

const API_URL = process.env.WORDPRESS_API_URL

const DogeHistory = ({data}) => {
  return (
    <section>
      <Head title="ABOUT DOGE" />
      <GoHome />
      <article className="doge-story">
        <h1 className="title-pill">Doge-Story</h1>
        <div className="doge-copy text-04" dangerouslySetInnerHTML={{ __html: data.options.about_copy }}/>
      </article>
      <style jsx global>{`
        .doge-story {
          width: calc(100vw - var(--sidebar));
          left: calc(var(--sidebar) + var(--space-md));
          padding-top: var(--space-lg);
          padding-bottom: var(--space-lg);
          z-index: 1200;
          position: relative;
          margin: 0 auto;
        }
        .doge-copy {
          width: 100%;
          max-width: 150rem;
          line-height: 1.2;
        }
        .doge-copy p {
          padding-bottom: var(--space-lg);
        }
      `}</style>
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
