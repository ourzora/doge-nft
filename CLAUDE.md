# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A statically-exported Next.js (Pages Router) marketing/auction site for the original Doge NFTs, deployed at `very.auction`. It is a *thin shell* around `@zoralabs/nft-components`: this repo owns content, layout, and styling; all on-chain data (media, auction state, bids, history) is fetched client-side by the Zora components. There is no backend, no API routes, and no database.

Note: this repo lives inside `~/zora-repos/`, but it is unrelated to the `zora/` and `zora-backend/` repos described in the parent `CLAUDE.md`. Its trunk branch is `master` (not `main`).

## Commands

```bash
yarn install
yarn dev      # next dev
yarn build    # next build
yarn start    # next start
```

Use **yarn** — the repo has `yarn.lock` and no npm/pnpm lockfile. There is no test suite, no linter, no typecheck, and no CI config. "Verifying a change" means `yarn build` plus loading the page.

## Architecture

### Two sources of truth per NFT

Every NFT appears twice in the data flow, and both halves must stay in sync:

1. **`lib/constants.js` → `NFT_LIST`** — hardcoded local metadata (`id`, `slug`, `title`, `description`, `image`). Used only for routing (`getStaticPaths`) and for SEO/OG tags in `components/head.js`. Never rendered as page body copy.
2. **On-chain data** — fetched at runtime by `NFTPreview` (grid, `components/doge-cards.js`) and `NFTFullPage` (detail, `pages/doge/[id].js`) from the Zora Media contract. This is what the user actually sees.

So editing a `title`/`description` in `constants.js` changes the `<title>`/`<meta>` but **not** the visible page text — that comes from token metadata. The contract address `0xabEFBc9fD2F806065b4f3C237d4b59D9A97Bcac7` is hardcoded in both `components/doge-cards.js` and `pages/doge/[id].js`; changing collections means editing both.

`getStaticPaths` uses `fallback: false`, so adding an NFT requires a rebuild, not just a data edit.

Dead fields: `auctionState` and `allowOffer` in `NFT_LIST` are not read anywhere. The real auction toggles are the hardcoded `config` object in `pages/doge/[id].js` (`allowOffer`, `showPerpetual`, `refreshInterval`) and the `showPerpetual` prop in `doge-cards.js`.

### Styling the Zora components (two separate mechanisms)

- **`MediaConfiguration` theme + `strings`** — exported from `pages/doge/[id].js`. Handles fonts, border radius, and string overrides the library exposes as an API.
- **`scss/_nft-component-overrides.scss`** — overrides the library's internal `.zora-*` class names (`.zora-fullTitle`, `.zora-fullItemInfo`, `.zora-pricingAmount`, …) with heavy `!important`. This is brittle by design and is the usual breakage point when bumping `@zoralabs/nft-components` — see the recent `update-forked-nft-components` commits.

### Styling system

- All SCSS is **global**, imported once as `scss/main.scss` in `pages/_app.js`. A new partial must be added to the `@import` list at the top of `main.scss` or it will not ship.
- Design tokens are CSS custom properties in `scss/_variables.scss` (colors, `--text-0N` sizes, `--space-*`, layout). Prefer these over literals.
- **Breakpoints come from `globals.json`**, converted to PostCSS custom media by `postcss.config.js`. Write `@media (--lg)` / `@media (--mobile)` / `@media (--hover)` — never raw pixel queries; the `--xs … --xxxl` names are generated from that one file.
- Root `font-size` scales by breakpoint in `main.scss`, so `rem` values are fluid.
- Class naming is `block_element` with modifier words (`doge-footer_wrapper product`, passed via a `location` prop).

### SVG handling

`.babelrc` enables `babel-plugin-inline-react-svg`, so `import Stroke from '../public/svg/brush-stroke.svg'` yields a React component (see `components/go-home.js`). Other SVGs/PNGs are referenced as plain `<img src="/…">`. Both patterns coexist — match whichever the surrounding file uses.

### Background layer

`components/background.js` renders outside `<main>` in `_app.js`: an animated Granim gradient canvas plus a floating word marquee. Granim is instantiated in a `useEffect` with no dependency array, so it re-instantiates on every render — client-only, and a known rough edge.

### Content pages

`/doge-history` and `/charities` render `components/doge-copy.js` against block arrays in `lib/about-copy.js` and `lib/charities-copy.js`. Blocks are `{ type: 'copy' | 'header' | 'images' | 'video' }`; `copy`/`header` bodies are raw HTML injected via `dangerouslySetInnerHTML`, `video` is a YouTube ID. To add a content section, add a block object — do not add bespoke JSX.

## Known dead code

- `components/NftData.js` is an empty file.
- `components/doge-nft-card.js` imports `@derpyvision/doge-nft-components`, which is **not in `package.json`**. It is unreferenced; importing it anywhere will break the build.

Both are stale; the README's mention of `doge-nft-card` as the Zora integration point is outdated — that role belongs to `components/doge-cards.js` and `pages/doge/[id].js`.
