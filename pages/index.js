import Head from '../components/head'
import Image from 'next/image'
import Link from 'next/link'
import characterRandomColor from '../scripts/characterRandomColor'

import DogeCard from '../components/doge-card'
import DogeHead from '../components/doge-head'

const API_URL = process.env.WORDPRESS_API_URL

export default function Index({ data, title }) {
  return (
    <section className="home-wrapper">
      <Head title="Home" />
      <div className="doge-border"/>
      <nav className="doge-nav-wrapper">
        {data.options.doge_list.map(
          (item) => (
            <DogeCard 
              key={item.image}
              doge={item}
            />
          )
        )}
      </nav>
      <div className="doge-sidebar">
        <DogeHead/>
        <div className="doge-title">
          <h1 className="text-04" dangerouslySetInnerHTML={{ __html: title }} />
          <p className="text-02 doge-intro" dangerouslySetInnerHTML={{ __html: data.options.intro_copy }} />
        </div>
        <div className="doge-ui">
          <Link href={'/doge-history'}>
            <a className="lozenge-button doge-history-button">Doge History</a>
          </Link>
        </div>
      </div>
      <style jsx>{`
        @keyframes shadowColor {
          0% {
            filter: drop-shadow(0 0 1.5rem yellow);
            border-color: white;
          }
          25% {
            filter: drop-shadow(0 0 0.75rem blue);
          }
          50% {
            filter: drop-shadow(0 0 0.75rem green);
          }
          75% {
            filter: drop-shadow(0 0 0.75rem orange);
          }
          100% {
            filter: drop-shadow(0 0 1.75rem red);
            border-color: yellow;
          }
        }
        .home-wrapper {
          width: 100vw;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1;
        }
        .doge-border,
        .doge-nav-wrapper {
          width: calc(100vw - (var(--sidebar) + (var(--space-md) * 3)));
          height: calc(100vh - (var(--space-md) * 2));
          position: fixed;
          top: var(--space-md);
          left: var(--space-md);
        }
        .doge-nav-wrapper {
          width: calc(100vw - (var(--sidebar) + (var(--space-md) * 3)));
          height: calc(100vh - (var(--space-md) * 2));
          position: fixed;
          top: var(--space-md);
          left: var(--space-md);
          overflow-y: scroll;
          scroll-snap-type: y proximity;
          display: grid;
          grid-column-gap: var(--gutter);
          padding: var(--gutter);
          grid-template-columns: 1fr 1fr;
        }
        .doge-nav-wrapper::-webkit-scrollbar {
          display: none;
        }
        .doge-nav-wrapper:after {
          content: '';
          width: 100%;
          position: relative;
          height: 6rem;
        }
        .doge-border {
          border: var(--border-width) solid var(--white);
          border-radius: var(--space-md);
          animation: shadowColor 14000ms alternate infinite;
          z-index: 1000;
          pointer-events: none;
        }
        .doge-sidebar {
          position: fixed;
          top: var(--space-md);
          right: var(--space-md);
          width: var(--sidebar);
          background-color: var(--white);
          border-radius: var(--space-md);
          animation: shadowColor 14000ms alternate infinite;
          display: flex;
          flex-direction: column;
          padding: var(--space-lg) var(--space-sm);
        }
        .doge-title {
          width: 100%;
          text-align: center;
          padding-top: var(--space-md);
        }
        .doge-title h1 {
          transform: rotate(-1deg);
        }
        .doge-ui {
          position: relative;
          padding: var(--space-sm) 0;
        }
        .doge-history-button {
          transform: rotate(2deg) scale(0.95);
          transition: transform 250ms var(--boing);
          will-change: transform;
        }
        .doge-intro {
          padding-top: var(--space-sm);
          color: var(--blue);
        }
        @media(hover:hover) {
          .doge-history-button:hover {
            transform: rotate(-2deg) scale(1);
          }
        }
      `}</style>
    </section>
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
