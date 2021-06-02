import Image from 'next/image'

const DogeFooter = (props) => {
  return (
    <a href="https://zora.co" target="_blank" className={`doge-footer_wrapper ${props.location}`}>
      <p><span className="blink">_ </span>Curated by Know Your Meme</p>
      <div className="doge-footer_zora-branding">
        <div className="zora-logo" />
      </div>
    </a>
  )
}

export default DogeFooter;