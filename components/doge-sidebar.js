import Link from 'next/link'
import React from 'react'

import characterWrap from '../scripts/characterWrap'
import { INTRO_COPY } from '../lib/constants'
import DogeHead from './doge-head'

const DogeSidebar = () => {
  
  /* FIX THIS */
  const title = characterWrap('Doge NFT Auction', 'span', 'doge-title_letter')
  
  return (
    <div className="doge-sidebar_wrapper">
      <div className="doge-sidebar_inner">
        <DogeHead />
        <div className="doge-sidebar_title">
          <h1 className="text-04 doge-title" dangerouslySetInnerHTML={{ __html: title }} />
          <p className="doge-sidebar_intro" dangerouslySetInnerHTML={{ __html: INTRO_COPY }} />
        </div>
        <div className="doge-sidebar_ui">
          <Link href={'/charities'} className="lozenge-button doge-sidebar_history-button">
            Charities
          </Link>
          <Link href={'/doge-history'} className="lozenge-button doge-sidebar_history-button">
            Doge History
          </Link>
        </div>
        <a className="doge-footer_blog-link" href="http://kabochan.blog.jp/" target="_blank">
          <span>Visit Atsuko's & Kabochan's Blog!</span>
        </a>
      </div>
    </div>
  )
}

export default DogeSidebar;
