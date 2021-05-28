import Head from '../components/head'
import GoHome from '../components/go-home'
import CopyBlock from '../components/doge-copy'
import DogeFooter from '../components/doge-footer'

import copy from '../lib/charities-copy'

const DogeHistory = () => {
  return (
    <>
      <Head title="Charities"/>
      <GoHome />
      <CopyBlock
        title="Charities"
        copy={copy}
      />
      <aside className="doge-history_bg"></aside>
      <DogeFooter location="history"/>
    </>
  )
}

export default DogeHistory
