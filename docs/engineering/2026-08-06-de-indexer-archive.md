# Replacing the dead Zora indexer with a committed on-chain snapshot

**Date:** 2026-08-06
**Trigger:** the site renders no artwork and no auction data; every host it fetches from is gone
**Outcome:** a self-contained static archive built from `snapshot/mainnet.json` and 2.70 MB of
artwork that is provably the bytes that were minted

This follows the same recipe as the holly-plus archive
(`holly-plus-auction-fork/docs/engineering/2026-08-05-de-indexer-archive.md`), adapted to a
different Zora library generation and a shared contract. Where the two diverge it is called
out, because the differences are the parts that are easy to get wrong.

---

## 1. The problem was larger than "images are broken"

Every data source `@zoralabs/nft-hooks@1.2.1` uses is permanently offline:

| Source | State | What it supplied |
|---|---|---|
| `indexer-prod-mainnet.zora.co/v1/graphql` | DNS does not resolve | tokens, metadata, owners |
| `api.thegraph.com/subgraphs/name/ourzora/zora-v1` | hosted service sunset | auction data |
| `api.thegraph.com/subgraphs/name/ensdomains/ens` | same | `useEnsResolution` |
| `zora-prod.mypinata.cloud/ipfs/` | DNS does not resolve | nft-hooks' IPFS gateway |
| `api.zora.co` (via `@zoralabs/zdk@2.1.6`) | 404 | the 1.x fetch strategy |
| `ipfs.fleek.co` | gone | **the gateway in the tokens' own on-chain `tokenURI`** |

All of them are hardcoded in `node_modules/@zoralabs/nft-hooks/dist/constants/urls.js`. The
package reads no `process.env` and exposes no override, so pointing the existing code at a live
RPC was not an option — the fetching layer had to be replaced. Only the *rendering* half of
`@zoralabs/nft-components` survives.

The last entry deserves emphasis. Even a caller who bypassed nft-hooks entirely and read
`tokenURI(3366)` straight off the chain would get
`https://ipfs.fleek.co/ipfs/bafybeiejv7…`, which resolves nowhere. The CID is fine; the gateway
baked into it in 2021 is not. Gateway rewriting is unavoidable for anyone reading this
collection today.

The auctions also finished in June 2021, so a live data layer was never the right answer.

## 2. What was built

### Snapshot pipeline (`scripts/snapshot/`)

Plain CommonJS, run by hand, never imported by the app. `ethers` was added as a devDependency
for these alone. They write `snapshot/mainnet.json`, which is the single source of truth.

| File | Role |
|---|---|
| `index.js` | orchestrator; `--only`, `--to-block`, `--skip-metadata`, `--verify` |
| `config.js` | addresses, gateways, the slug list, the capability-split RPC pool |
| `rpc.js` | JSON-RPC batching, retry, endpoint rotation, chunked `getLogs` fallback |
| `abi.js` | AuctionHouse event fragments and Media V1 selectors; topics computed, not hardcoded |
| `tokens.js` | `Transfer` scan filtered to our ids, plus one batched round of accessors |
| `auctions.js` | AuctionHouse scan → a settled sale per token, with display strings |
| `metadata.js` | gateway ladder, hash verification, PNG header parsing |
| `media.js` | downloads and commits the artwork, refusing anything that fails its hash |
| `verify.js` | proves the committed files against chain, offline or live |
| `probe.js` | diagnostic: which CIDs still resolve, and from where |

`rpc.js` was taken from holly-plus unchanged, including the **capability-split keyless RPC
pool**, which remains the non-obvious part. No single free endpoint does the whole job:
tenderly serves unlimited-range archive `eth_getLogs` but throttles batches; publicnode refuses
archive requests but batches of 20 fine; drpc handles historical `eth_call` but caps `getLogs`
at 10k blocks and 403s without a User-Agent.

### The shim (`lib/zora-shim.js`)

`NFTFullPage` and `NFTPreview` are data *providers* wrapped around the dead indexer.
`buildNFTDataContextValue()` constructs the `NFTDataContext` value from a snapshot token and
`components/nft-data/snapshot-provider.js` supplies it; we then render those components'
children ourselves. The rendering components keep working with their class names and emotion
styles, which is what the ~26 `.zora-*` selectors in four of our stylesheets depend on.

### Media

`public/media/<tokenId>/{image.png, metadata.json}` — 17 files, 2.70 MB — plus a manifest of
CIDs, hashes, byte lengths and paths.

**No resizing step and no ImageMagick.** These are 640×480 PNGs of 306–382 KB, so the
full-resolution original is also the display asset. That makes this archive stronger than the
holly-plus one, which had to derive thumbnails from 9–93 MB animated GIFs and therefore served
nothing byte-exact. It also means there is no multi-gigabyte tier to stage into object storage:
`public/media` **is** the archive.

## 3. Findings that changed the work

**`AuctionEnded.amount` is not the sale price.** This was caught by an invariant on the very
first run, which failed on all eight tokens. `amount` is `tokenOwnerProfit` — what the seller
received after the AuctionHouse routed settlement through Zora Media's bidShares:

```
token 3366   winning bid   1696.9    ETH
             creator 10%   -169.69          (Zora Media bidShares, on-chain royalty)
             curator 1%    -15.2721         (levied on the remainder, not the bid)
             seller net    1511.9379  = AuctionEnded.amount
```

The ported holly-plus code read `amount` as the price, correctly — that collection had a 0%
curator fee and no on-chain royalty, so the two were equal. Here it would have understated all
eight sales by ~11% and contradicted the figure this auction is publicly known for. The sale
price is the winning bid; the split is recorded under `sale.settlement` and an invariant now
asserts the three parts sum back to it.

**The timestamp rule is inverted from holly-plus.** nft-components 0.3.x did
`new Date(timestamp + "Z")` and needed naive strings. 1.2.x does plain `new Date(timestamp)`
against values the ZDK wrote with `toISOString()`, so the `Z` must be present or every date is
parsed as local time. Several of the shim's rules invert this way; they are tabulated in
`CLAUDE.md` because porting from the holly-plus shim is the obvious thing to try.

**Zora Media V1 is a shared contract.** It holds hundreds of thousands of tokens from every
Zora V1 creator. Filtering AuctionHouse logs on `tokenContract` alone returns 16,026 logs, most
of them other people's. Adding our eight ids in the `topics[2]` position brings that to 156.
The "one Transfer scan gives you the whole collection" shortcut that works on a dedicated
ERC-721 does not apply.

**But the contract gives something better in exchange:** it records `sha256` of the content and
of the metadata on chain, at mint. So recovery is *provable*, not merely plausible — and this
covers the dag-pb (`bafybei…`) CIDs that holly-plus's CID-digest trick could not verify at all.
`verify.js` is a direct hash comparison, and every one of the 16 files passes.

**There was no second auction round.** The site's git history has an `auction-2` branch from
September 2021, which suggested more than one sale per token. The chain shows exactly one
`AuctionCreated` per token, all in June 2021. The September activity was secondary-market
trading, which the snapshot records separately under `secondaryTransfers`.

## 4. Three latent bugs, all invisible until the pages had data

None of these were introduced by this work; all of them were waiting for the data to arrive.

**Cards rendered an `<a>` inside an `<a>`.** `MediaThumbnail` draws an `AddressView`, which is
an anchor, and every card is wrapped in a `next/link` anchor. That is invalid HTML: the parser
hoists the inner one out, so the DOM stops matching what React rendered. Result was eleven
React #418s on the index and the whole root falling back to client rendering. Before the
archive there was no data, so `AddressView` returned a bare `"..."` and no anchor ever existed.
Nothing is lost by fixing it — `.zora-cardItemInfo div { display: none }` already hid that line.

**The artwork never appeared.** `MediaLoader` starts at `loading: true` and reveals the image
on its `onLoad` handler, but a server-rendered same-origin PNG finishes loading before React
hydrates and attaches the listener. The event is missed and it sits at `opacity: 0` forever
over an image with `complete === true` and `naturalWidth === 640`. The old site never hit this
because imgix was fetched client-side, well after hydration.

**`aria-describedby` did not survive hydration.** `NFTFullPage` derives it from
`useA11yIdPrefix`, backed by a module-level counter that keeps incrementing across the pages
rendered in one build but restarts at 0 in the browser.

The general shape is the same in all three, and it is the thing to remember about this
codebase: **making data available at SSR turns a class of client-only sloppiness into hard
hydration failures.** The same reasoning is why `BidHistory`, `AuctionInfo` and
`PricingComponent` were replaced — `toLocaleString` keys off the machine timezone and
`Intl.NumberFormat` off `navigator.language`, so a UTC build and a Los Angeles visitor
disagree. Display strings are now precomputed at snapshot time.

## 5. Decisions, including what was rejected

**Chose: shim, keep `@zoralabs/*`.** The alternative — dropping the packages and rendering
eight tokens with local JSX — is tempting at this scale, but the `.zora-*` selectors are not a
thin veneer. They span four stylesheets and only override *part* of each rule; the emotion base
layer still carries the grid, container and card sizing. Reproducing that by hand with no
working reference to diff against is a much bigger job than it looks. See §7.

**Rejected: width/height attributes on the artwork.** A reasonable anti-layout-shift measure
in general, but they act as CSS presentational hints and pinned the image to its intrinsic
640px inside a wrapper the stylesheet sizes with `height: 100%`, which is narrower than the
geometry the library's own `<img>` produces. Measured at 1440px: 640px wide with them, 825px
without, against a 952px wrapper. Fidelity to the original layout won.

**Rejected: giving the index page the token page's theme.** The cards previously rendered with
no `MediaConfiguration` at all, so they used the library defaults. They now get a theme
containing only the kill-switches, so nothing about their appearance changes.

**Kept: the current owner, not the auction winner.** Seven of the eight changed hands after
their sale — token 3372 eleven times, most recently at block 17534648 in 2023. The page shows
the current holder as of `meta.toBlock`, which is what the live site did; `ownerAtSale` is
recorded too, so this is reversible without re-fetching. `snapshot:verify --chain` treats owner
drift as expected rather than a failure.

**Kept: the auction-only history.** Mint, listed, approved, bids, won — what the original site
showed. Secondary transfers are captured in the snapshot but not rendered.

**Changed: site copy to past tense**, and removed the "Sell Your Meme?" typeform. An archive
that says the auction is live is misleading.

## 6. Current state

```
8 tokens · blocks 12545032..25697649 · 0 warnings
8 auctions created, 8 ended, 0 canceled, 93 bids, 39 duration extensions
auction ids 144-151, all settled June 2021
sold 9.696969 - 1696.9 ETH, 1876.4428 ETH total
metadata 8/8 hash-verified · media 16/16 hash-verified · 2.70 MB
```

`yarn build` emits 13 static pages with no `getServerSideProps`. The emitted HTML contains none
of the dead hosts.

Verified in a headless browser at 390px and 1440px, timezone `America/Los_Angeles` and locale
`de-DE` against a UTC build: **zero third-party requests, zero hydration errors, zero console
errors, no broken images** on the index and on token pages.

An independent check on the recovery: for all eight tokens the `name`, `description` and image
CID read back off IPFS are byte-identical to the values that were hardcoded by hand in
`lib/constants.js` in 2021, from a different source. And the committed artwork hashes were
confirmed with `shasum -a 256` against a raw `eth_call`, outside the code that produced them.

## 7. Known gaps

**`@zoralabs/*` are still linked**, so their dead-host constants remain in the JS bundle as
unreachable dead code. Nothing requests them and the rendered HTML references none. They
disappear when the packages do — which is the point at which all ~26 `.zora-*` selectors must
be ported into our own stylesheets. That is the natural next step and the reason it has not
been taken yet.

**`MediaConfiguration` still constructs a `ZDKFetchStrategy`** on every render. It fetches
nothing, but it is what keeps `@zoralabs/zdk` in the bundle.

**No deployment configuration exists in the repo** — no `vercel.json`, no `netlify.toml`, no
`.github/`. Whatever deploys this is configured elsewhere. `SITE_URL` in `lib/constants.js` is
the single place the domain is written down; `og:image` is built from it at snapshot time, so a
domain change is a regeneration rather than a code edit.

**IPFS availability will decay.** All 16 CIDs resolve today, and `yarn snapshot:probe` reports
which ones still do. Once they stop, the committed files remain verifiable against the on-chain
hashes forever — which is the point — but the archive will no longer be regenerable from
scratch. `scripts/snapshot/overrides/` exists for hand-recovered bytes, which can still be
proven correct because the expected hash is on chain.

## 8. Regenerating

```bash
yarn snapshot                  # rebuild snapshot/mainnet.json from chain + IPFS
yarn snapshot:media            # re-download and re-verify public/media/**
yarn snapshot:verify           # re-hash committed files, fully offline
yarn snapshot:verify --chain   # also re-read hashes/owners from Ethereum and diff
yarn snapshot --verify         # re-derive the chain half and diff; expects no drift
yarn snapshot:probe            # which CIDs still resolve, and from where
```

`snapshot --verify` compares only chain-derived data and reuses the committed `meta.toBlock`.
Which gateway happened to answer is not deterministic, so including provenance would report
drift on every run and make the check useless. Current result:
`OK: chain data reproduces exactly (8 tokens)`.

Tuning for a flaky IPFS day: `IPFS_PASSES`, `IPFS_TIMEOUT_MS`, `IPFS_GATEWAYS` (comma-separated
substrings). A fast first pass (`IPFS_PASSES=1 IPFS_TIMEOUT_MS=20000`) to get an artifact, then
`--only <ids>` with long timeouts for stragglers, works well.

## 9. Verification performed

- `yarn build` — clean, 13 static pages, 8 token pages matching the snapshot
- Emitted HTML contains zero references to any of the six dead hosts
- `snapshot:verify` — 16/16 files match their on-chain sha256
- `snapshot:verify --chain` — 0 mismatches, 0 unexpected differences
- `snapshot --verify` — chain data reproduces exactly
- Committed hashes cross-checked with `shasum -a 256` against a raw `eth_call`, outside this code
- Recovered names, descriptions and image CIDs byte-identical to the 2021 hardcoded list
- All 8 token routes and `/`, `/charities`, `/doge-history` return 200; an unknown slug 404s
- All 16 media files return 200 with the byte length the snapshot records
- Headless browser, 390px and 1440px, `America/Los_Angeles` + `de-DE` against a UTC build:
  no third-party requests, no hydration errors, no console errors, no broken images
- Token 3366's figures spot-checked against the public record (1696.9 ETH, June 2021)

### Bugs found in this work's own code, during verification

- The first `media.js` run left `settlement: undefined` reaching `getStaticProps`, which Next
  rejects outright rather than dropping. Keys are now omitted rather than set to `undefined`.
- `stripForDisplay()` initially kept `secondaryTransfers`, roughly doubling the index page's
  `__NEXT_DATA__` for data no page renders.
- The first browser check passed while the index was throwing eleven hydration errors: in a
  production build React reports them only as `invariant=418`, with no mention of the word
  "hydration", and the check was grepping for the word. Any `pageerror` now fails the check.
  Worth remembering — a green console assertion against minified React can mean nothing.
