import Image from 'next/image'
import YouTube from 'react-youtube';

const DogeImages = props =>
  <div className={`doge-copy_images image-grid-${props.images.length}`}>
    {props.images.map((item, i) => (
      <div className={`doge-copy_image-wrapper`} key={`${item}-${i}`}>
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
  <article className="doge-copy_wrapper">
    <h1 className="title-pill">{props.title}</h1>
    {props.copy.map(
      (item, i) => (
        <div className={`doge-copy_module ${item.type}`} key={`${item.type}-${i}`}>
          {
            item.type === 'copy' ? <div dangerouslySetInnerHTML={{ __html: item.content }} /> :
              item.type === 'header' ? <h2 dangerouslySetInnerHTML={{ __html: item.content }} /> :
                item.type === 'images' ? <DogeImages images={item.images} /> :
                  item.type === 'video' ? <VideoWrapper video={item.content} /> :
                  false
          }
        </div>
      )
    )}
  </article>

export default DogeCopy