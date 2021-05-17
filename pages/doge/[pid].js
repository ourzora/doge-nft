import { useRouter } from 'next/router'
import GoHome from '../components/go-home'

const Doge = () => {
  const router = useRouter()
  const { pid } = router.query

  return (
    <section>
      <GoHome />
      <p>Doge: {pid}</p>
    </section>
  ) 
}

export default Doge