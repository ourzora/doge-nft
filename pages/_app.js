import '../scss/main.scss'
import Background from '../components/background'

function MyApp({ Component, pageProps }) {
  return (
    <main>
      <Component {...pageProps} />
      <Background />
    </main>
  )
}

export default MyApp
