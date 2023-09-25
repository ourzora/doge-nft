import Link from 'next/link'
import DogeHead from '../components/doge-head'
import Stroke from '../public/svg/brush-stroke.svg'

const GoHome = () => {
  return (
    <div className="go-home_wrapper">
      <Link href="/" className="go-home_link">
        <DogeHead/>
        <span className="go-home_cta lozenge-button">Go Home</span>
      </Link>
      <div className="go-home_paint-wrapper">
        <Stroke className="go-home_paint" />
      </div>
    </div>
  )
}

export default GoHome;