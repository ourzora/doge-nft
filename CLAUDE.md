# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A statically generated Next.js (Pages Router) **archive** of the Doge NFT auctions. The eight
original Doge memes were auctioned as 1/1 NFTs in June 2021 and all sold; the site is a record
of that, not a live auction.

Every page is built from `snapshot/mainnet.json` and the artwork committed under
`public/media/`. **The site makes no network calls at build time or at runtime.** That is a
hard requirement, not an optimisation — see below.

Note this repo lives inside `~/zora-repos/`, but it is unrelated to the `zora/` and
`zora-backend/` repos described in the parent `CLAUDE.md`. Its trunk branch is `master`, not
`main`. The sibling `holly-plus-auction-fork/` was archived the same way and its engineering
record is worth reading for context.

## Commands

```bash
yarn install
yarn dev      # next dev
yarn build    # next build — 13 static pages
yarn start    # next start

yarn snapshot           # rebuild snapshot/mainnet.json from chain + IPFS
yarn snapshot:media     # re-download and re-verify public/media/**
yarn snapshot:verify    # re-hash committed files against the snapshot (offline)
yarn snapshot:verify --chain   # also re-read hashes/owners from Ethereum and diff
yarn snapshot --verify  # re-derive the chain half and diff against what's committed
yarn snapshot:probe     # report which IPFS CIDs still resolve, and from where
```

Use **yarn** — `yarn.lock` is the only lockfile. There is no test suite, no linter, no
typecheck and no CI. Verifying a change means `yarn build` plus the checks below.

## Why the archive exists

Every data source `@zoralabs/nft-hooks@1.2.1` uses is permanently offline, and all of the URLs
are hardcoded in `node_modules/@zoralabs/nft-hooks/dist/constants/urls.js` with no env
override and no public API to point them elsewhere:

| Source | State |
|---|---|
| `indexer-prod-mainnet.zora.co/v1/graphql` | DNS does not resolve |
| `api.thegraph.com/subgraphs/name/ourzora/zora-v1` | hosted service sunset |
| `api.thegraph.com/subgraphs/name/ensdomains/ens` | same — this is what `useEnsResolution` used |
| `zora-prod.mypinata.cloud/ipfs/` | DNS does not resolve |
| `api.zora.co` (via `@zoralabs/zdk@2.1.6`) | 404 |
| `ipfs.fleek.co` | gone — and it is the gateway in the tokens' own on-chain URIs |

So the fetching layer had to be replaced wholesale. Only the *rendering* half of
`@zoralabs/nft-components` survives.

## Architecture

### One source of truth

`snapshot/mainnet.json` holds everything: tokens, metadata, owners, the full auction history,
and pointers into `public/media/`. It is produced offline by `scripts/snapshot/` and committed.

`lib/constants.js` keeps only `TOKEN_SLUGS` — the one piece of token data with no on-chain
source. Its **order defines the grid order** on the index page (index 0 is the hero card) and
its **slug defines the URL** (`/doge/feisty-doge`). Both predate the archive; do not change
them. `scripts/snapshot/config.js` keeps a CommonJS duplicate, because the scripts must not
depend on the app's module graph.

### `lib/snapshot.js` is server-only

It reads the file with `fs.readFileSync`, deliberately, rather than importing the JSON.
**Never import it from a component.** The `fs` import is the enforcement: pull this into
client code and the build fails with `Can't resolve 'fs'` instead of silently shipping ~100 KB
of snapshot to every visitor. `stripForDisplay()` drops provenance fields before anything
becomes page props — the index embeds all eight tokens and 93 bids into `__NEXT_DATA__`.

### The shim is the crux

`NFTFullPage` and `NFTPreview` are *data providers*: each mounts its own `NFTDataProvider`,
which calls `useNFT()`, which fetches from the dead hosts above. They cannot be configured out
of it. So:

- `lib/zora-shim.js` builds the `NFTDataContext` value (nft-hooks 1.2.x's `NFTObject`) from a
  snapshot token.
- `components/nft-data/snapshot-provider.js` supplies it.
- We render those components' *children* directly instead of using the two wrappers.

This keeps every `.zora-*` class name and emotion style, which matters because ~26 of those
selectors are load-bearing across `scss/_nft-component-overrides.scss`, `scss/_doge-cards.scss`,
`scss/_doge-nft.scss` and `scss/main.scss`.

**1.2.x rules that are the inverse of 0.3.x.** If you port anything from the holly-plus shim,
these will bite:

| | 1.2.x (here) | 0.3.x (holly-plus) |
|---|---|---|
| Context shape | flat `{data, currencyLoaded}` | `{nft: {...}, metadata: {...}}` |
| `currentBid` on a finished auction | **must be present** — `AuctionInfo` reads `.creator` unguarded | must be absent |
| Timestamps | full ISO **with** trailing `Z` — `new Date(ts)` | naive, no `Z` — `new Date(ts + "Z")` |

Other load-bearing details, all commented at their call sites:

- `rawData` must be an object. `ProofAuthenticity` indexes `data.rawData["zora-indexer"]`
  unguarded. Leaving it `{}` also suppresses the dead zora.co link — as does omitting
  `contract.knownContract`.
- `metadata.contentUri` must stay `undefined`, or `MediaObject` gives `useNFTContent` a key and
  fires a request at Zora's dead pinata gateway.
- `nft.contentURI` must be an `http(s)` URL containing `/ipfs/` — `ProofAuthenticity` renders
  it as the "View on IPFS" href and picks the label by testing for that substring.
- Bids are sorted **descending**; the components index the first element without sorting.
- Timestamps carry `logIndex % 1000` in the milliseconds field so two bids in the same block do
  not collide on `BidHistory`'s `key={actor}-{createdAt}` or tie in its sort.

### Five local components in `components/nft-data/`

Each replaces a stock component that cannot work in a static, server-rendered archive. The
reason is written at the top of each file; in short:

| File | Replaces | Why |
|---|---|---|
| `nft-history.js` | `BidHistory` | `toLocaleString` is timezone-dependent — hydration mismatch for every non-UTC visitor |
| `sold-for.js` | `AuctionInfo` | `PricingString` uses `Intl.NumberFormat(navigator.language)` — same problem |
| `card-pricing.js` | `PricingComponent` | same |
| `card-thumbnail.js` | `MediaThumbnail` | it renders an `<a>` (AddressView) inside the card's `next/link` `<a>`; invalid nesting breaks hydration |
| `media-image.js` | `MediaObject`/`MediaFull` | `MediaLoader` reveals the image on `onLoad`, which a server-rendered same-origin PNG fires before React hydrates — stuck at opacity 0 forever |
| `doge-nft-full.js` | `NFTFullPage` body | wrapper divs the SCSS targets, minus the three children that cannot render |

**The general rule: anything that formats a number or a date at render time will break
hydration here**, because the data is now present at SSR. Precompute it in the snapshot
instead — that is why `soldAmountLabel`, `soldDateTimeLabel` and the per-bid labels exist, and
why they are hand-rolled rather than using `Intl` (so `--verify` reproduces byte-identically
regardless of Node's ICU build).

Three of `NFTFullPage`'s children are dropped entirely: `PlaceOfferButton` (ignores
`config.allowOffer` and always renders a dead zora.co link), `CreatorEquity` (active auctions
only) and `CollectionTag` (disabled via `useCollectionTag`).

### Theme kill-switches

`lib/media-theme.js`. `useEnsResolution: false` is **required** — `AddressView` otherwise fires
a dozen failing requests per page at the sunset ENS subgraph. The index page gets
`CARD_STYLE` (kill-switches only) rather than `FULL_PAGE_STYLE`, because its cards previously
rendered with no `MediaConfiguration` at all and inherited the library defaults; adding the
token page's fonts there would change how they look.

### The snapshot pipeline

`scripts/snapshot/` is plain CommonJS, run by hand, **never imported by the app**. `ethers` is
a devDependency for these scripts alone.

Two things are specific to this contract being **Zora Media V1**:

- It is **shared and multi-tenant** — hundreds of thousands of tokens from every Zora V1
  creator. Filtering AuctionHouse logs on `tokenContract` alone returns 16,026 logs; adding our
  eight ids in the `topics[2]` position brings it to 156. The same applies to `Transfer`. Any
  new log scan must filter by token id.
- Content and metadata are **separate URIs with separate CIDs**, and the contract records
  `sha256` of both on chain (`tokenContentHashes` / `tokenMetadataHashes`). That is what makes
  the archive provable rather than merely trusted, and it is why `verify.js` compares hashes
  directly instead of deriving a digest from the CID.

**`AuctionEnded.amount` is not the sale price.** It is `tokenOwnerProfit` — the seller's net
after the AuctionHouse routes settlement through Zora Media's bidShares. Token 3366: winning
bid 1696.9 ETH, minus a 10% on-chain creator royalty and a 1% curator fee on the remainder,
leaves 1511.9379. The sale price is the **winning bid**; the split is under `sale.settlement`
and an invariant asserts the parts sum back.

### Styling

- All SCSS is global, imported once as `scss/main.scss` in `pages/_app.js`. A new partial must
  be added to the `@import` list there or it will not ship.
- Design tokens are CSS custom properties in `scss/_variables.scss`.
- **Breakpoints come from `globals.json`**, converted to PostCSS custom media by
  `postcss.config.js`. Write `@media (--lg)` / `@media (--mobile)` / `@media (--hover)`, never
  raw pixel queries.
- Root `font-size` scales by breakpoint in `main.scss`, so `rem` values are fluid.
- Class naming is `block_element` with modifier words (`doge-footer_wrapper product`).

### SVG handling

`.babelrc` enables `babel-plugin-inline-react-svg`, so `import Stroke from
'../public/svg/brush-stroke.svg'` yields a React component (see `components/go-home.js`). Other
assets are plain `<img src="/…">`. Both patterns coexist — match the surrounding file.

## Gotchas

- **`scripts/` holds two unrelated things.** `scripts/snapshot/` is the offline build pipeline.
  `scripts/{characterWrap,characterRandomColor,randomColor}.js` are runtime *browser* utilities
  used by `components/doge-sidebar.js`.
- **`components/background.js` re-instantiates Granim on every render** — `useEffect` with no
  dependency array. Pre-existing; harmless today but easy to make loud.
- `@zoralabs/nft-components@1.2.1` declares `peerDependencies: react ^17.0.2` against React 18.
  It only uses `useContext`/`useMemo`/`useState`/`forwardRef`, so it works, but yarn warns.
- The tokens are tradeable, so `owner` drifts. The snapshot records both `owner` (as of
  `meta.toBlock`) and `ownerAtSale`; `snapshot:verify --chain` treats owner drift as expected.

## Verifying a change

```bash
yarn build                       # must emit 13 static pages
yarn snapshot:verify             # 16/16 files match their on-chain sha256
yarn snapshot --verify           # chain data reproduces exactly (8 tokens)
```

Then, if you touched anything that renders:

- Grep the emitted HTML in `.next/server/pages` for `indexer-prod-mainnet.zora.co`,
  `api.thegraph.com`, `zora-prod.mypinata.cloud`, `api.zora.co`, `cloudflare-eth.com`,
  `ipfs.fleek.co`. Expect zero.
- Load a token page and the index in a browser with the devtools network tab open. **Zero
  third-party requests** is the whole point of this repo.
- Check the console with a **non-UTC timezone and a non-en locale** against a UTC build. In a
  production build React reports hydration failures only as `invariant=418/423/425`, with no
  mention of the word "hydration" — grep for the codes, not the word.

## Known gap

`@zoralabs/nft-components` and `@zoralabs/nft-hooks` are still installed, so their dead-host
constants remain in the JS bundle as unreachable dead code. Nothing requests them. Removing the
packages is the natural next step, and is also the point at which all ~26 `.zora-*` selectors
have to be ported into our own stylesheets — which is the reason it has not been done.
