import Image from 'next/image'

const DogeHead = () => {
  return (
    <div className="doggie shadow">
      <Image
        src="/atsuko-kabosu-crop.png"
        alt="Picture of the Doge"
        layout="fill"
      />
    </div>
  )
}

export default DogeHead;
