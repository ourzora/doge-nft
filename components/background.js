import React, { useRef, useEffect } from 'react'
import Granim from 'granim'

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
              ['#FF6347', '#00ff00'],
              ['#00ffff', '#ffff00']
            ]
          }
        }
      });
    }
  });

  return (
    <aside className="doge-bg">
      <canvas ref={canvasRef} id="doge-gradient"></canvas> 
      <style jsx>{`
        .doge-bg,
        #doge-gradient {
          width: 100vw;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          background-color: var(--pink);
          z-index: 0;
        }
      `}</style>
    </aside>
  )
}


export default Background;