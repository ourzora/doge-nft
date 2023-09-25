import Link from 'next/link'
import { NFTPreview } from "@derpyvision/doge-nft-components";

const DogeCard = (props) => {
  return (
    <Link href={`/doge/${props.doge.slug}`} className="doge-card_wrapper">
      <div className="doge-card_wrapper-inner">
        <NFTPreview id={props.doge.id} />
      </div>
    </Link>
  )
}

export default DogeCard;
