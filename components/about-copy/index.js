import copy from './copy'
import Image from 'next/image'
import YouTube from 'react-youtube';

const DogeImages = props =>
  <div className={`doge-history_images image-grid-${props.images.length}`}>
    {props.images.map((item, i) => (
      <div className={`doge-history_image-wrapper`} key={`${item}-${i}`}>
        <Image
          src={item}
          layout="fill"
          objectFit="contain"
        />
      </div>
    ))}
  </div>

const VideoWrapper = props => {
  const opts = {
    playerVars: {
      autoplay: 0,
    },
  };
  return (
    <YouTube className={'video-wrapper'} videoId={props.video} opts={opts} />
  )
}
  

const DogeCopy = props =>
  <article className="doge-history_wrapper">
    <h1 className="title-pill">The History of Doge: From Humble Shiba to Meme Legend</h1>
    {copy.map(
      (item, i) => (
        <div className={`doge-history_module ${item.type}`} key={`${item.type}-${i}`}>
          {
            item.type === 'copy' ? <div dangerouslySetInnerHTML={{ __html: item.content }} /> :
              item.type === 'images' ? <DogeImages images={item.images} /> :
                item.type === 'video' ? <VideoWrapper video={item.content} /> :
                  false
          }
        </div>
      )
    )}
  </article>

export default DogeCopy