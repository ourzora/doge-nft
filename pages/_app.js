import '../scss/main.scss'
import Background from '../components/background'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <main>
        <Component {...pageProps} />
      </main>
      {/*<Background />*/}
    </>
  )
}

export default MyApp
