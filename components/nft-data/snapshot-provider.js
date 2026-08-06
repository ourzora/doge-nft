import { useMemo } from 'react'
import { NFTDataContext } from '@zoralabs/nft-components'

import { buildNFTDataContextValue } from '../../lib/zora-shim'

/**
 * Drop-in replacement for NFTDataProvider, fed from the committed snapshot.
 *
 * Wrap the Zora render components in this instead of using NFTFullPage/NFTPreview —
 * those mount their own provider, which fetches from hosts that no longer exist.
 */
const SnapshotProvider = ({ token, meta, children }) => {
  const value = useMemo(() => buildNFTDataContextValue(token, meta), [token, meta])
  return <NFTDataContext.Provider value={value}>{children}</NFTDataContext.Provider>
}

export default SnapshotProvider
