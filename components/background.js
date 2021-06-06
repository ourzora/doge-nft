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
    word: 'Dogecoin',
    pos: 'foreground'
  },
  {
    word: 'Shiba Inu',
    pos: 'background'
  },
  {
    word: '“dog”',
    pos: 'foreground'
  },
  {
    word: '“Biz Cas Fri 1,”',
    pos: 'background'
  },
  {
    word: 'Wow',
    pos: 'foreground'
  },
  {
    word: 'Kabosu',
    pos: 'background'
  },
  {
    word: 'Kabosu loves having her photo taken',
    pos: 'foreground'
  },
  {
    word: 'Redditor',
    pos: 'background'
  },
  {
    word: 'Doge memes',
    pos: 'foreground'
  },
  {
    word: 'Bitcoin boom',
    pos: 'background'
  },
  {
    word: 'altcoin',
    pos: 'foreground'
  },
  {
    word: '“to the moon”',
    pos: 'background'
  },
  {
    word: '“wholesome” precursors',
    pos: 'foreground'
  },
  {
    word: '/r/DogeLore',
    pos: 'background'
  },
  {
    word: 'Cheems',
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
    word: '“Meme of the Decade”',
    pos: 'background'
  },
  {
    word: 'Doge remains',
    pos: 'foreground'
  },
  {
    word: 'joy to people',
    pos: 'background'
  },
  {
    word: 'legacy',
    pos: 'foreground'
  },
  {
    word: 'around the world',
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
      {/*
        <div id="words">
          {words.map((word, i) => (
            <div
              key={`word-${i}`}
              className={`word ${word.pos}`}
            >
              <span>{word.word}</span>
            </div>
          ))}
        </div>
      */}
      <canvas ref={canvasRef} id="doge-gradient"></canvas>
    </aside>
  )
}

export default Background;
