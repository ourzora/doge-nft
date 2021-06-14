import Link from 'next/link'
import React from 'react'

import characterWrap from '../scripts/characterWrap'
import { INTRO_COPY } from '../lib/constants'
import DogeHead from './doge-head'




const DogeSidebar = () => {
  
  /* FIX THIS */
 
  
  return (
   

    <div className="doge-sidebar_wrapper">
      
      <div className="doge-sidebar_inner">
        <DogeHead />
        <div className="doge-sidebar_title">


          
        
        </div>
          
      
          <p><span className="blink">_ </span><a target="_blank" href="https://zora.co/jawn">Zora </a></p>
          <p><span className="blink">_ </span><a target="_blank" href="https://twitter.com/jawnciego">Twitter</a></p>
          <p><span className="blink">_ </span><a target="_blank" href="https://instagram.com/jawndiego">IG </a></p>
 
        
      </div>
    </div>
  )
}


export default DogeSidebar;
