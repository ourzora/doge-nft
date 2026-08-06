#!/usr/bin/env node
// Diagnostic: which of the sixteen CIDs still resolve, and from where.
//
// Nothing in the build depends on this. It exists to answer "can this archive still
// be regenerated from IPFS?" — the answer degrades over time as pins expire, and it
// is worth knowing before the answer becomes no.
//
//   node scripts/snapshot/probe.js

const fs = require('fs')
const path = require('path')
const { GATEWAYS, USER_AGENT, paths } = require('./config')
const { stripScheme } = require('./metadata')

const TIMEOUT_MS = Number(process.env.IPFS_TIMEOUT_MS || 20000)

async function head(base, cid) {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS)
  const started = Date.now()
  try {
    const res = await fetch(base + cid, {
      method: 'HEAD',
      headers: { 'user-agent': USER_AGENT },
      signal: ctl.signal,
      redirect: 'follow',
    })
    return { ok: res.ok, status: res.status, ms: Date.now() - started }
  } catch (e) {
    return { ok: false, status: e.name === 'AbortError' ? 'timeout' : e.message, ms: Date.now() - started }
  } finally {
    clearTimeout(timer)
  }
}

async function main() {
  const file = path.join(process.cwd(), paths.snapshot)
  if (!fs.existsSync(file)) {
    console.error(`no ${paths.snapshot} — run \`yarn snapshot\` first`)
    process.exit(2)
  }
  const { tokens } = JSON.parse(fs.readFileSync(file, 'utf8'))

  const refs = []
  for (const t of tokens) {
    if (t.content && t.content.uri) refs.push({ tokenId: t.tokenId, kind: 'content', cid: stripScheme(t.content.uri) })
    if (t.metadataRef && t.metadataRef.uri) {
      refs.push({ tokenId: t.tokenId, kind: 'metadata', cid: stripScheme(t.metadataRef.uri) })
    }
  }

  console.log(`probing ${refs.length} CIDs across ${GATEWAYS.length} gateways\n`)

  let reachable = 0
  for (const ref of refs) {
    const results = await Promise.all(GATEWAYS.map((gw) => head(gw.base, ref.cid)))
    const ok = results.filter((r) => r.ok)
    if (ok.length) reachable++
    const detail = GATEWAYS.map((gw, i) => {
      const host = new URL(gw.base).host
      return `${host}=${results[i].ok ? `${results[i].ms}ms` : results[i].status}`
    }).join('  ')
    console.log(
      `${ref.tokenId} ${ref.kind.padEnd(8)} ${ok.length}/${GATEWAYS.length}  ${ref.cid.slice(0, 20)}…\n    ${detail}`
    )
  }

  console.log(`\n${reachable}/${refs.length} CIDs reachable on at least one gateway`)
  process.exit(reachable === refs.length ? 0 : 1)
}

main().catch((e) => {
  console.error(e && e.stack ? e.stack : e)
  process.exit(1)
})
