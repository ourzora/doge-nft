import Image from 'next/image'

const DogeFooter = (props) => {
  return (
    <footer className={`doge-footer_wrapper ${props.location}`}>
      <a className="doge-footer_blog-link" href="http://kabochan.blog.jp/" target="_blank">
        <span>Visit Atsuko's & Kabochan's Blog!</span>
      </a>
      <a className="doge-footer_zora-link" href="https://zora.co/" target="_blank">
        <img src="/zora-logo.png"></img>
      </a>
    </footer>
  )
}

export default DogeFooter;