import Link from 'next/link'
import DogeHead from '../components/doge-head'
import Stroke from '../public/svg/brush-stroke.svg'

const GoHome = () => {
  return (
    <div className="home-link-wrapper">
      <Link href="/">
        <a className="home-link">
          <DogeHead/>
          <span className="home-cta lozenge-button">Go Home</span>
        </a>
      </Link>
      <div className="go-home-paint-wrapper">
        <Stroke className="go-paint" />
      </div>
      <style jsx global>{`
        .home-link-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          padding-top: var(--space-md);
          z-index: 9000;
          width: var(--sidebar);
          height: var(--sidebar);
          display: flex;
          justify-content: center;
          overflow: visible;
          z-index: 10;
        }
        .home-link-wrapper .doggie {
          z-index: 10;
        }
        .home-cta {
          transform: translateY(-1rem);
          z-index: 1;
          position: relative;
          max-width: 24rem;
          margin: auto;
        }
        .go-home-paint-wrapper {
          transform: rotate(200deg) scale(.75);
          position: fixed;
          top: -35rem;
          left: -15rem;
          z-index: 0;
        }
        .go-paint * {
          fill: yellow;
        }
      `}</style>
    </div>
  )
}

export default GoHome;