import Image from 'next/image'

const DogeFooter = (props) => {
  return (
    <a href="https://zora.co" target="_blank" className={`doge-footer_wrapper ${props.location}`}>
      <p className="text-01" ><span className="blink">_ </span>powered by zora</p>
      <div className="doge-footer_zora-branding">
        <div className="zora-logo" />
      </div>
    </a>
  )
}

export default DogeFooter;