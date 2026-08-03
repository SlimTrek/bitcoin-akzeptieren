# AGENTS.md

## Cursor Cloud specific instructions

This repo is a **static HTML/CSS/JS website** (German-language Bitcoin info site for `bitcoin-akzeptieren.ch`), deployed via GitHub Pages. There is **no build step, package manager, backend, or database** — no `package.json`, lockfiles, or dependencies to install. The update script is intentionally a no-op.

### Running the site (development)

Serve the repo root over HTTP — do **not** open the HTML files via `file://`. `main.js` loads shared components with absolute paths (`fetch('/navbar.html')`, `/footer.html`) and pages reference assets like `/Images/...`, so the navbar/footer only render when the site is served from the repository root.

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/index.html`.

### Notes / gotchas

- The navbar and footer are injected client-side by `main.js` on `DOMContentLoaded`. If they don't appear, you are almost certainly serving from the wrong directory or using `file://`.
- Live widgets (BTC price, block height, fees) and the DCA/Sats tools fetch from public third-party APIs (CoinGecko, mempool.space) directly from the browser, and the merchant page embeds a BTC Map iframe. These require outbound internet access; pages still render without it, but those widgets will be blank.
- No env vars or secrets are required (all external APIs are public/unauthenticated).
- There is no lint or test tooling configured in this repo.
