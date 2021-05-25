import React, { useEffect, useRef } from 'react'
import Granim from 'granim'
import Stroke from '../public/svg/brush-stroke.svg'
import { useRouter } from 'next/router'

const Background = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if(typeof window !== 'undefined') {
      var granimInstance = new Granim({
        element: '#doge-gradient',
        name: 'granim',
        opacity: [1, 1],
        direction: 'radial',
        states : {
          "default-state": {
            gradients: [
              ['#f6f6f6', '#ffffff'],
              ['#e3e3e3', '#f6f6f6']
            ]
          }
        }
      });
    }
  });

  return (
    <aside className="doge-bg">
      <div className="strokes">
        <div className="paint-1-wrapper">
          <Stroke className="paint-1 light-shadow" />
        </div>
        <div className="paint-2-wrapper">
          <Stroke className="paint-2 light-shadow" />
        </div>
        <div className="paint-3-wrapper">
          <Stroke className="paint-3 light-shadow" />
        </div>
      </div>
      <canvas ref={canvasRef} id="doge-gradient"></canvas>
    </aside>
  )
}

export default Background;
