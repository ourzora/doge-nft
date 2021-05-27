import Image from 'next/image'

const DogeFooter = (props) => {
  return (
    <footer className={`doge-footer_wrapper ${props.location}`}>
      <p className="text-02" >Powered by Zora</p>
      <a className="doge-footer_zora-link" href="https://zora.co/" target="_blank">
        <img src="/zora-logo.png"></img>
      </a>
    </footer>
  )
}

export default DogeFooter;