import Image from 'next/image'
import Link from 'next/link'

const DogeCard = (props) => {
  return (
    <div className="card-wrapper shadow">
      <div className="card-wrapper-inner">
        <div className="card-title">
          <span>{props.doge.title}</span>
        </div>
        <div className="image-wrapper">
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
      .card-wrapper {
        position: relative;
        height: calc(var(--innerheight) / 1.75);
        min-height: 50rem;
        width: 100%;
        padding: var(--space-md);
        transition: transform 450ms var(--boing);
        will-change: transform;
        cursor: pointer;
      }
      @media(hover:hover) {
        .card-wrapper:hover {
          transform: rotate(-2deg) scale(1.05);
          animation: shadowColor 250ms alternate-reverse infinite;
          z-index: 2000;
        }
        .card-wrapper:hover .card-title {
          transform: rotate(2deg);
          box-shadow:
            0 0 10px 0px blue,
            0 0 20px 10px #fff,
            0 0 30px 30px #f0f,
            0 0 35px 50px #0ff;
        }
      }
      .card-wrapper img {
        object-fit: cover;
        width: 100%;
        height: 100%;
        position: absolute;
      }
      .card-wrapper-inner {
        width: 100%;
        height: 100%;
        position: relative;
      }
      .image-wrapper {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        border-radius: 3rem;
        overflow: hidden;
      }
      .card-title {
        padding: 0 var(--space-md);
        height: var(--button-height);
        display: flex;
        justify-content: center;
        align-items: center;
        position: absolute;
        bottom: calc((var(--button-height) / 2) * -1);
        right: 3rem;
        z-index: 100;
        font-size: var(--text-02);
        border-radius: 50rem;
        background: blue;
        color: white;
        transition: all 350ms var(--ease);
        box-shadow:
          0 0 5px 0px blue,
          0 0 5px 5px #fff,
          0 0 7px 9px #f0f,
          0 0 10px 12px #0ff;
      }
    `}</style>`
    </div>
  )
}

export default DogeCard;
