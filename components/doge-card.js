import Image from 'next/image'
import Link from 'next/link'

const DogeCard = (props) => {
  return (
    <div className="doge-card_item">
      <Link href={`/doge/${props.doge.slug}`}>
        <a className="doge-card_wrapper shadow">
          <div className="doge-card_wrapper-inner">
            <div className="doge-card_title">
              <span>{props.doge.title}</span>
            </div>
            <div className="doge-card_image-wrapper">
              <Image
                src={props.doge.image}
                alt={props.doge.title}
                layout="fill"
              />
            </div>
          </div>
          <style jsx global>{`
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
        `}</style>`
        </a>
      </Link>
    </div>
  )
}

export default DogeCard;
