/**
 * MediaConfiguration themes.
 *
 * ARCHIVE_THEME is the part that has to be everywhere: the switches that stop
 * @zoralabs/nft-components reaching for hosts that no longer exist. FULL_PAGE_STYLE
 * adds the typography the token page has always set.
 *
 * The index page deliberately gets only ARCHIVE_THEME. Its cards previously rendered
 * with no MediaConfiguration at all, so they used the library defaults — adding the
 * token page's fonts and border radius there would change how they look.
 */
export const ARCHIVE_THEME = {
  /**
   * Required for an offline archive. AddressView calls useENSAddress, which resolves
   * through the ensdomains subgraph on api.thegraph.com — sunset along with
   * everything else this site depended on. There are around a dozen AddressViews on a
   * token page, so leaving this on means a dozen failing requests per page load for a
   * name nobody is waiting on. Passing `undefined` to useENSAddress gives SWR a null
   * key, so nothing is even scheduled.
   */
  useEnsResolution: false,

  /**
   * Set for intent, but a no-op at 1.2.1: the username branch in AddressView is
   * commented out and useZoraUsername is never called from it. Kept in case it returns.
   */
  useZoraUsernameResolution: false,

  /**
   * Already the 1.2.1 default — it was Zora's dead pinata host in 0.3.x. Stated
   * explicitly because it is load-bearing and easy to regress. Note getNormalizedURI
   * only rewrites URIs containing "/ipfs/", so the committed /media/... paths are
   * unaffected either way.
   */
  preferredIPFSGateway: 'https://ipfs.io/ipfs/',
}

export const CARD_STYLE = { theme: ARCHIVE_THEME }

export const FULL_PAGE_STYLE = {
  theme: {
    ...ARCHIVE_THEME,
    titleFont: {
      fontWeight: 300,
      fontSize: 'var(--text-02)',
      fontFamily: 'var(--font)',
    },
    bodyFont: {
      color: 'var(--blue)',
      fontSize: 'var(--text-02)',
      fontWeight: 300,
      fontFamily: 'var(--font)',
    },
    defaultBorderRadius: 20,
    useCollectionTag: false,
  },
}
