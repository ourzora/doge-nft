const { USER_AGENT } = require('./config')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const toHex = (n) => '0x' + Number(n).toString(16)

/** Round-robin over a list of endpoints, so a throttled one gets skipped next try. */
function createPool(endpoints) {
  let i = 0
  return {
    current: () => endpoints[i % endpoints.length],
    rotate: () => {
      i++
    },
    size: endpoints.length,
  }
}

async function post(url, body, timeoutMs = 30000) {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': USER_AGENT },
      body: JSON.stringify(body),
      signal: ctl.signal,
    })
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch (e) {
      throw new Error(`non-JSON response (${res.status}): ${text.slice(0, 200)}`)
    }
  } finally {
    clearTimeout(timer)
  }
}

/** A single RPC call, rotating endpoints with exponential backoff. */
async function call(pool, method, params, { tries = 6, timeoutMs = 60000 } = {}) {
  let lastErr
  for (let attempt = 0; attempt < tries; attempt++) {
    const url = pool.current()
    try {
      const json = await post(url, { jsonrpc: '2.0', id: 1, method, params }, timeoutMs)
      if (json.error) throw new Error(`${url}: ${JSON.stringify(json.error)}`)
      return json.result
    } catch (e) {
      lastErr = e
      pool.rotate()
      await sleep(400 * 2 ** attempt)
    }
  }
  throw lastErr
}

/**
 * Batched eth_calls. A rate-limited batch comes back as a *single object*
 * ({error:{code:-32005}}) rather than an array — detect that, halve the batch
 * size, back off and retry. Per-item errors are returned as data, not thrown:
 * a tokenURI revert legitimately means "this token is burned".
 *
 * requests: [{ method, params }]
 * returns:  [{ result } | { error }]
 */
async function batch(pool, requests, { size = 20, delayMs = 250, tries = 6 } = {}) {
  const out = new Array(requests.length)
  let cursor = 0
  let currentSize = size

  while (cursor < requests.length) {
    const slice = requests.slice(cursor, cursor + currentSize)
    const body = slice.map((r, k) => ({
      jsonrpc: '2.0',
      id: k,
      method: r.method,
      params: r.params,
    }))

    let ok = false
    let lastErr
    for (let attempt = 0; attempt < tries && !ok; attempt++) {
      const url = pool.current()
      try {
        const json = await post(url, body, 60000)
        if (!Array.isArray(json)) {
          throw new Error(`batch rejected by ${url}: ${JSON.stringify(json).slice(0, 200)}`)
        }
        if (json.length !== slice.length) throw new Error(`short batch response from ${url}`)
        const byId = new Map(json.map((x) => [x.id, x]))
        for (let k = 0; k < slice.length; k++) {
          const item = byId.get(k)
          if (!item) throw new Error(`missing id ${k} in batch response`)
          out[cursor + k] = item.error ? { error: item.error } : { result: item.result }
        }
        ok = true
      } catch (e) {
        lastErr = e
        currentSize = Math.max(1, Math.floor(currentSize / 2))
        pool.rotate()
        await sleep(600 * 2 ** attempt)
      }
    }
    if (!ok) throw new Error(`batch failed permanently at offset ${cursor}: ${lastErr}`)
    cursor += slice.length
    if (cursor < requests.length) await sleep(delayMs)
  }
  return out
}

/**
 * eth_getLogs over a wide range, falling back to fixed-size chunks when an
 * endpoint enforces a block-range cap.
 */
async function getLogs(widePool, chunkedPool, filter, { chunk = 10000, onProgress } = {}) {
  try {
    return await call(widePool, 'eth_getLogs', [filter], { tries: 3, timeoutMs: 120000 })
  } catch (e) {
    if (!/range|limit|too large|10000|exceed/i.test(String(e))) throw e
    const from = Number(filter.fromBlock)
    const to = Number(filter.toBlock)
    const acc = []
    for (let f = from; f <= to; f += chunk) {
      const t = Math.min(f + chunk - 1, to)
      const part = await call(chunkedPool, 'eth_getLogs', [
        { ...filter, fromBlock: toHex(f), toBlock: toHex(t) },
      ])
      acc.push(...part)
      if (onProgress) onProgress(t, to, acc.length)
      await sleep(150)
    }
    return acc
  }
}

/** eth_getBlockByNumber for many blocks, batched. Returns Map<number, timestamp:number>. */
async function fetchBlockTimestamps(pool, blockNumbers) {
  const unique = [...new Set(blockNumbers)].sort((a, b) => a - b)
  const requests = unique.map((n) => ({
    method: 'eth_getBlockByNumber',
    params: [toHex(n), false],
  }))
  const results = await batch(pool, requests)
  const map = new Map()
  results.forEach((r, i) => {
    if (r.error || !r.result) throw new Error(`block ${unique[i]}: ${JSON.stringify(r.error)}`)
    map.set(unique[i], parseInt(r.result.timestamp, 16))
  })
  return map
}

module.exports = { sleep, toHex, createPool, post, call, batch, getLogs, fetchBlockTimestamps }
