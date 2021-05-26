import React, { useEffect, useRef } from 'react'
import Granim from 'granim'
import Stroke from '../public/svg/brush-stroke.svg'

const words = [
  {
    word: 'Wow',
    pos: 'foreground'
  },
  {
    word: 'So scare',
    pos: 'background'
  },
  {
    word: 'What r u doing',
    pos: 'foreground'
  },
  {
    word: 'Concern',
    pos: 'background'
  },
  {
    word: 'r-a-p-e',
    pos: 'foreground'
  },
  {
    word: 'Keep ur hands away from me',
    pos: 'background'
  },
  {
    word: 'Wow',
    pos: 'foreground'
  },
  {
    word: 'So scare',
    pos: 'background'
  },
  {
    word: 'What r u doing',
    pos: 'foreground'
  },
  {
    word: 'Concern',
    pos: 'background'
  },
  {
    word: 'r-a-p-e',
    pos: 'foreground'
  },
  {
    word: 'Keep ur hands away from me',
    pos: 'background'
  },
  {
    word: 'Wow',
    pos: 'foreground'
  },
  {
    word: 'So scare',
    pos: 'background'
  },
  {
    word: 'What r u doing',
    pos: 'foreground'
  },
  {
    word: 'Concern',
    pos: 'background'
  },
  {
    word: 'r-a-p-e',
    pos: 'foreground'
  },
  {
    word: 'Keep ur hands away from me',
    pos: 'background'
  },
  {
    word: 'Wow',
    pos: 'foreground'
  },
  {
    word: 'So scare',
    pos: 'background'
  },
  {
    word: 'What r u doing',
    pos: 'foreground'
  },
  {
    word: 'Concern',
    pos: 'background'
  },
  {
    word: 'r-a-p-e',
    pos: 'foreground'
  },
  {
    word: 'Keep ur hands away from me',
    pos: 'background'
  }
]

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
      <div id="words">
        {words.map((word, i) => (
          <div
            key={`word-${i}`}
            className={`word ${word.pos} text-02`}
          >
            <span>{word.word}</span>
          </div>
        ))}
      </div>
      <canvas ref={canvasRef} id="doge-gradient"></canvas>
    </aside>
  )
}

export default Background;
