import Link from 'next/link'
import { NFTPreview } from "@zoralabs/nft-components";
import { NFT_LIST } from '../lib/constants'

const DogeCard = (props) => {
  return (
    <Link href={`/doge/${props.doge.slug}`} className="doge-card_wrapper shadow">
      <div className="doge-card_wrapper-inner">
        <NFTPreview className="doge-card" contract='0xabEFBc9fD2F806065b4f3C237d4b59D9A97Bcac7' showPerpetual={false} id={props.doge.id} />
      </div>
    </Link>
  )
}

const DogeCards = () => {
  return (
    <>
      {NFT_LIST.map(
        (item, i) => (
          <div className="doge-cards_list-item" key={`${item.id}-${i}`}>
            <DogeCard doge={item} index={i}/>
          </div>
        )
      )}
    </>
  )
}

export default DogeCards
