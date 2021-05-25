import Link from 'next/link'
import { NFTPreview } from "@zoralabs/nft-components";

const DogeCard = (props) => {
  return (
    <Link href={`/doge/${props.doge.slug}`}>
      <a className="doge-card_wrapper shadow">
        <div className="doge-card_wrapper-inner">
          <NFTPreview id={props.doge.nft_id} />
        </div>
      </a>
    </Link>
  )
}

export default DogeCard;
