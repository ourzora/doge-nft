import Image from 'next/image'

const DogeHead = () => {
  return (
    <div className="doggie shadow">
      <Image
        src="/icons/the-doge.png"
        alt="Picture of the Doge"
        layout="fill"
      />
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
        .doggie {
          width: 20rem;
          height: 20rem;
          position: relative;
          margin: 0 auto;
          filter: var(--black-shadow);
        }
        .doggie img {
          image-rendering: pixelate;
        }
        @media(hover:hover) {
          .doggie:hover {
            animation: shadowColor 500ms alternate-reverse infinite;
          }
        }
      `}</style>
    </div>
  )
}

export default DogeHead;
