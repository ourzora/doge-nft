import Head from '../components/head'
import Image from 'next/image'
import Link from 'next/link';

const Index = () => {
  return (
    <div className="home-wrapper">
      <Head title="Home" />
      <ul className="doge-wrapper">

      </ul>
      <div className="doge-sidebar">
        <div className="doggie">
          <Image
            src="/icons/the-doge.png"
            alt="Picture of the Doge"
            layout="fill"
          />
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
        .doge-wrapper {
          width: calc(100vw - (var(--sidebar) + (var(--space-md) * 3)));
          height: calc(100vh - (var(--space-md) * 2));
          position: fixed;
          top: var(--space-md);
          left: var(--space-md);
        }
        .doge-sidebar {
          position: fixed;
          top: var(--space-md);
          right: var(--space-md);
          width: var(--sidebar);
          height: calc(100vh - (var(--space-md) * 2));
          background-color: var(--white);
          border-radius: var(--space-md);
          animation: shadowColor 14000ms alternate infinite;
          display: flex;
          flex-direction: column;
          padding: var(--space-lg) var(--space-sm);
        }
        .doge-wrapper:after {
          content: '';
          position: absolute;
          top: calc((var(--border-width)) * -1);
          left: calc((var(--border-width)) * -1);
          width: 100%;
          height: 100%;
          border: var(--border-width) solid var(--white);
          border-radius: var(--space-md);
          animation: shadowColor 14000ms alternate infinite;
        }
        .doggie {
          width: 20rem;
          height: 20rem;
          position: relative;
          margin: 0 auto;
          animation: shadowColor 14000ms alternate-reverse infinite;
        }
        .doggie img {
          image-rendering: pixelate;
        }
        .doge-ui {
          position: relative;
          padding: var(--space-md) 0;
        }
        .doge-history-button {
          transform: rotate(2deg);
        }
      `}</style>
    </div>
  )
};

export default Index
