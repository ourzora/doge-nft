import Head from '../components/head'
import Image from 'next/image'

const Index = () => {
  return (
    <div className="home-wrapper">
      <Head title="Home" />
      <ul className="dogge-wrapper"></ul>
      <div className="doggie">
        <Image
          src="/icons/doge-bitmap-coinish.png"
          alt="Picture of the Doge"
          layout="fill"
        />
      </div>
      <style jsx>{`
        .home-wrapper {
          width: 100vw;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1;
        }
        .dogge-wrapper {
          width: calc(100vw - (var(--sidebar) + (var(--big-pad) * 2)));
          height: calc(100vh - (var(--big-pad) * 2));
          position: fixed;
          top: var(--big-pad);
          left: var(--big-pad);
          
        }
        .dogge-wrapper:after {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border: 3px solid white;
          border-radius: var(--big-pad);
          filter: drop-shadow(0 0 0.75rem yellow);
        }
        .doggie {
          width: 20rem;
          height: 20rem;
          position: fixed;
          right: var(--big-pad);
          top: var(--big-pad);
        }
        .doggie img {
          image-rendering: pixelate;
        }
      `}</style>
    </div>
  )
};

export default Index
