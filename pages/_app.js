import '../scss/main.scss'
import Background from '../components/background'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <main>
        <Component {...pageProps} />
      </main>
      <Background />
      <style jsx>{`
        main {
          position: absolute;
          z-index: 10;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
        }
      `}</style>
    </>
  )
}

export default MyApp
