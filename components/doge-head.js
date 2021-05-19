import Image from 'next/image'

const DogeHead = () => {
  return (
    <div className="doggie shadow">
      <Image
        src="/icons/the-doge.png"
        alt="Picture of the Doge"
        layout="fill"
      />
    </div>
  )
}

export default DogeHead;
