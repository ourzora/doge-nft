import Head from '../components/head'
import GoHome from '../components/go-home'
import CopyBlock from '../components/doge-copy'
import Image from 'next/image'
import DogeFooter from '../components/doge-footer'

import copy from '../lib/about-copy'

const DogeHistory = () => {
  return (
    <>
      <Head
        title="About Doge"
        description="Hardly a day goes by online that you won’t find yourself encountering “Doge” in some form or fashion. Whether it be a simple meme, discussion about the Dogecoin cryptocurrency or even just a picture of a Shiba Inu, the legendary Doge is arguably the most famous meme of all time."
      />
      <GoHome />
      <CopyBlock
        title="The History of Doge: From Humble Shiba to Meme Legend"
        copy={copy}
      />
      <aside className="doge-history_bg"></aside>
      <a href="https://knowyourmeme.com/" target="_blank" className="doge-history_kym">
        <p>Written and prepared by Know Your Meme</p>
        <div className="doge-history_kym-logo">
          <Image
            src={'/about-pictures/know-your-meme-logo.png'}
            layout="fill"
            objectFit="contain"
          />
        </div>
      </a>
      <DogeFooter location="history"/>
    </>
  )
}

export default DogeHistory
