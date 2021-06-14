import Link from 'next/link'
import DogeHead from '../components/doge-head'


const GoHome = () => {
  return (
    <div className="go-home_wrapper">
      <Link href="/">
        <a className="go-home_link">
          <DogeHead/>
          <span className="go-home_cta lozenge-button">☮</span>
        </a>
      </Link>

    </div>
  )
}

export default GoHome;