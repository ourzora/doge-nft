import fs from 'fs'
import path from 'path'

import { TOKEN_SLUGS } from './constants'

/**
 * Server-only reader for snapshot/mainnet.json.
 *
 * IMPORTANT: never import this from a component. It is only safe inside
 * getStaticProps/getStaticPaths, and the `fs` import is what enforces that — pull it
 * into client code and the build fails with "Can't resolve 'fs'" rather than silently
 * shipping the whole snapshot to the browser.
 *
 * That is also why this reads off disk instead of `import snapshot from
 * '../snapshot/mainnet.json'`. Next 13 will usually tree-shake a JSON import that is
 * only reachable from getStaticProps, but "usually" depends on the import being
 * provably unreachable — and one day someone imports this module for a single
 * constant and the elimination quietly stops happening. `fs` makes that a build
 * error instead of a 100 KB regression nobody notices.
 */

const SNAPSHOT_PATH = path.join(process.cwd(), 'snapshot', 'mainnet.json')

let cached = null

export function loadSnapshot() {
  if (cached) return cached
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    throw new Error(
      `snapshot/mainnet.json is missing. It is committed, so this usually means a ` +
        `partial checkout. Regenerate it with \`yarn snapshot && yarn snapshot:media\`.`
    )
  }
  cached = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'))
  return cached
}

export function getSnapshotMeta() {
  return loadSnapshot().meta
}

/**
 * Drop everything the pages never render.
 *
 * The index page embeds all eight tokens and their 93 bids into __NEXT_DATA__, so
 * this is not cosmetic — provenance fields (hashes, byte counts, secondary transfers,
 * per-bid block positions) roughly double the serialized payload and none of it is
 * displayed. It stays in the committed snapshot, which is where it belongs.
 */
function stripForDisplay(token) {
  const { secondaryTransfers, content, metadataRef, sale, ...rest } = token
  // Omit keys rather than setting them to undefined: getStaticProps serializes to
  // JSON and Next rejects an explicit undefined outright.
  const { settlement, bids, ...saleRest } = sale
  return {
    ...rest,
    content: {
      mimeType: content.mimeType,
      // Kept: ProofAuthenticity renders this as the "View on IPFS" link.
      gatewayUrl: content.gatewayUrl,
      localPath: content.localPath,
      width: content.width,
      height: content.height,
    },
    metadataRef: { gatewayUrl: metadataRef.gatewayUrl, localPath: metadataRef.localPath },
    sale: {
      ...saleRest,
      bids: bids.map(({ blockNumber, logIndex, ...bid }) => bid),
    },
  }
}

const bySlug = (slug) => (token) => token.slug === slug

/** All tokens, in the order lib/constants.js defines. */
export function getAllTokens() {
  const { tokens } = loadSnapshot()
  return TOKEN_SLUGS.map(({ slug }) => {
    const token = tokens.find(bySlug(slug))
    if (!token) throw new Error(`snapshot has no token for slug "${slug}"`)
    return stripForDisplay(token)
  })
}

export function getTokenBySlug(slug) {
  const token = loadSnapshot().tokens.find(bySlug(slug))
  if (!token) throw new Error(`snapshot has no token for slug "${slug}"`)
  return stripForDisplay(token)
}

export function getTokenSlugs() {
  return TOKEN_SLUGS.map(({ slug }) => slug)
}
