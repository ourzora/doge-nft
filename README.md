# Doge NFT Auction

![Doge NFT Auction](https://repository-images.githubusercontent.com/367550525/60e38280-c786-11eb-8b1c-c70d3110068a)

An archive of the Doge NFT auctions. The original Doge memes — Atsuko Sato's photographs of
Kabosu — were auctioned as 1/1 NFTs for charity in June 2021, and all eight sold. This is no
longer a live auction site; it is a static record of one.

Every page is built from `snapshot/mainnet.json`, a committed capture of the collection taken
directly from Ethereum and IPFS, and from the artwork committed under `public/media/`. **The
site makes no network calls at build or at runtime.** That is not an optimisation: Zora's
indexer, the `ourzora/zora-v1` subgraph, Zora's IPFS gateway and the `ipfs.fleek.co` gateway
named in the tokens' own on-chain URIs are all permanently offline, so the data had to be
captured and committed.

Because Zora Media V1 records `sha256` of both the artwork and the metadata on chain, every
committed file can be **proven** to be the bytes that were minted rather than merely trusted:

```bash
yarn snapshot:verify           # re-hash all 16 files against the snapshot, fully offline
yarn snapshot:verify --chain   # also re-read the hashes from Ethereum and diff
```

## Running it

```bash
yarn install
yarn dev       # http://localhost:3000
yarn build     # 13 static pages
yarn start     # serve the production build
```

## Regenerating the archive

```bash
yarn snapshot         # rebuild snapshot/mainnet.json from chain + IPFS
yarn snapshot:media   # re-download and re-verify public/media/**
yarn snapshot --verify  # re-derive the chain half and diff against what's committed
yarn snapshot:probe   # report which IPFS CIDs still resolve, and from where
```

## Code structure

- `snapshot/` — `mainnet.json`, the single source of truth for every page
- `scripts/snapshot/` — the offline pipeline that produces it (plain CommonJS, never bundled)
- `lib/` — snapshot access (`snapshot.js`), the Zora data shim (`zora-shim.js`), site copy
- `components/nft-data/` — the bridge between the snapshot and `@zoralabs/nft-components`
- `components/` — everything else on the site
- `scss/` — stylesheets, including the `.zora-*` overrides the Zora components depend on
- `public/media/` — the verified artwork and metadata
- `pages/` — Next.js pages

`CLAUDE.md` has the detail, including why the Zora components are still installed and what it
would take to remove them.
