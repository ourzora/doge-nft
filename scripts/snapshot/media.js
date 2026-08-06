#!/usr/bin/env node
/**
 * Commit the artwork.
 *
 * Downloads each token's content and metadata from IPFS, refuses anything whose
 * sha256 does not match the hash the contract recorded at mint, and writes the bytes
 * verbatim into public/media/. From then on the site serves its own copy and the
 * IPFS gateways are needed only to regenerate.
 *
 * There is deliberately no resizing step. These are 640x480 PNGs of ~340 KB, so the
 * full-resolution original IS the display asset — no ImageMagick dependency, and
 * every pixel the site serves is provably the one that was minted. (The equivalent
 * holly-plus step had to derive thumbnails because its originals were 9-93 MB
 * animated GIFs, which meant nothing it served was byte-exact.)
 *
 *   node scripts/snapshot/media.js
 *   node scripts/snapshot/media.js --only 3366 --force
 */

const fs = require('fs')
const path = require('path')
const { SITE_URL, paths } = require('./config')
const { fetchVerified, sha256, pngDimensions } = require('./metadata')

const MIME_EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

function parseArgs(argv) {
  const args = { only: null, force: false }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--only') args.only = argv[++i].split(',').map((s) => s.trim())
    else if (argv[i] === '--force') args.force = true
    else throw new Error(`unknown flag: ${argv[i]}`)
  }
  return args
}

/** Cache raw downloads outside the repo so a re-run is free. Gitignored. */
function cached(cid) {
  return path.join(process.cwd(), paths.cache, cid)
}

async function loadBytes(uri, expectedHash, cid, { force }) {
  const cacheFile = cached(cid)
  if (!force && fs.existsSync(cacheFile)) {
    const buffer = fs.readFileSync(cacheFile)
    if (sha256(buffer) === expectedHash) return { buffer, from: 'cache' }
  }
  const res = await fetchVerified(uri, expectedHash)
  if (!res.buffer) throw new Error(`could not fetch ${uri}\n    ${res.errors.join('\n    ')}`)
  if (res.verified !== true) {
    throw new Error(
      `${uri} served bytes that do NOT match the on-chain hash\n` +
        `    got      ${res.sha256}\n    expected ${expectedHash}\n    from     ${res.gateway}`
    )
  }
  fs.mkdirSync(path.dirname(cacheFile), { recursive: true })
  fs.writeFileSync(cacheFile, res.buffer)
  return { buffer: res.buffer, from: res.gateway }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const snapshotFile = path.join(process.cwd(), paths.snapshot)
  if (!fs.existsSync(snapshotFile)) {
    console.error(`no ${paths.snapshot} — run \`yarn snapshot\` first`)
    process.exit(2)
  }
  const snapshot = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'))
  const mediaRoot = path.join(process.cwd(), paths.media)
  const manifest = {}
  let written = 0

  for (const token of snapshot.tokens) {
    if (args.only && !args.only.includes(token.tokenId)) {
      // Keep the manifest complete even on a partial run.
      if (token.content && token.content.localPath) {
        manifest[token.tokenId] = {
          contentCid: token.content.cid,
          contentSha256: token.content.sha256,
          contentBytes: token.content.bytes,
          contentPath: token.content.localPath,
          metadataCid: token.metadataRef.cid,
          metadataSha256: token.metadataRef.sha256,
          metadataPath: token.metadataRef.localPath,
        }
      }
      continue
    }

    const dir = path.join(mediaRoot, token.tokenId)
    fs.mkdirSync(dir, { recursive: true })

    const contentHash = String(token.content.sha256).replace(/^0x/, '')
    const metadataHash = String(token.metadataRef.sha256).replace(/^0x/, '')

    const content = await loadBytes(token.content.uri, contentHash, token.content.cid, args)
    const metadata = await loadBytes(token.metadataRef.uri, metadataHash, token.metadataRef.cid, args)

    const ext = MIME_EXT[token.content.mimeType]
    if (!ext) throw new Error(`token ${token.tokenId}: unhandled mime type ${token.content.mimeType}`)

    const imageName = `image.${ext}`
    fs.writeFileSync(path.join(dir, imageName), content.buffer)
    fs.writeFileSync(path.join(dir, 'metadata.json'), metadata.buffer)
    written += 2

    const dimensions = pngDimensions(content.buffer)
    const imageSrc = `/${path.posix.join('media', token.tokenId, imageName)}`

    token.content.verified = true
    token.content.bytes = content.buffer.length
    token.content.localPath = imageSrc
    if (dimensions) {
      token.content.width = dimensions.width
      token.content.height = dimensions.height
    }

    token.metadataRef.verified = true
    token.metadataRef.bytes = metadata.buffer.length
    token.metadataRef.localPath = `/${path.posix.join('media', token.tokenId, 'metadata.json')}`

    token.media = {
      imageSrc,
      // Absolute: crawlers do not resolve relative og:image. Built from SITE_URL so a
      // domain change is a regeneration rather than a code edit.
      ogImageSrc: `${SITE_URL}${imageSrc}`,
      width: dimensions ? dimensions.width : null,
      height: dimensions ? dimensions.height : null,
    }

    manifest[token.tokenId] = {
      contentCid: token.content.cid,
      contentSha256: token.content.sha256,
      contentBytes: content.buffer.length,
      contentPath: imageSrc,
      metadataCid: token.metadataRef.cid,
      metadataSha256: token.metadataRef.sha256,
      metadataPath: token.metadataRef.localPath,
    }

    console.log(
      `  ${token.tokenId} ${imageName} ${String(content.buffer.length).padStart(7)} bytes ` +
        `${dimensions ? `${dimensions.width}x${dimensions.height} ` : ''}verified  (${content.from})`
    )
  }

  fs.writeFileSync(
    path.join(mediaRoot, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n'
  )
  fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2) + '\n')

  const total = Object.values(manifest).reduce((n, m) => n + (m.contentBytes || 0), 0)
  console.log(
    `\nwrote ${written} files to ${paths.media} (${(total / 1e6).toFixed(2)} MB of artwork) ` +
      `and updated ${paths.snapshot}`
  )
  console.log('next: yarn snapshot:verify')
}

main().catch((e) => {
  console.error('\n' + (e && e.stack ? e.stack : e))
  process.exit(1)
})
