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
          <Stroke className="paint-1 pulse-animation light-shadow" />
        </div>
        <div className="paint-2-wrapper">
          <Stroke className="paint-2 pulse-animation light-shadow" />
        </div>
        <div className="paint-3-wrapper">
          <Stroke className="paint-3 pulse-animation light-shadow" />
        </div>
      </div>
      <canvas ref={canvasRef} id="doge-gradient"></canvas>
      <style jsx>{`
        .paint-1-wrapper,
        .paint-2-wrapper,
        .paint-3-wrapper {
          position: fixed;
        }
        .paint-1-wrapper {
          width: 20vw;
          height: 50vh;
          transform: rotate(120deg);
          top: 0;
          left: 0;
        }
        .paint-2-wrapper {
          width: 20vw;
          height: 50vh;
          transform: rotate(-120deg);
          top: 0;
          right: 0;
        }
        .paint-3-wrapper {
          width: 20vw;
          height: 50vh;
          transform: rotate(-50deg);
          bottom: -20vh;
          right: 0;
        }
        .doge-bg,
        #doge-gradient,
        .strokes {
          width: 100vw;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 0;
          pointer-events: none;
        }
        .strokes {
          z-index: 1;
        }
      `}</style>
    </aside>
  )
}

export default Background;
