import Image from 'next/image'

const DogeFooter = (props) => {
  return (
    <div className={`doge-footer_wrapper ${props.location}`}>
      <p>Curated by Know Your Meme</p>
      <a target="_blank" href="https://knowyourmeme.com/" className="doge-footer_kym-branding">
        <img src="/kym-logo/kym-80px.png" alt="Know Your Meme Logo"/>
      </a>
    </div>
  )
}

export default DogeFooter;