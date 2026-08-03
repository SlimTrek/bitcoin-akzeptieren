# AGENTS.md

## Cursor Cloud specific instructions

This repo is a **static HTML/CSS/JS website** (German-language Bitcoin info site for `bitcoin-akzeptieren.ch`), deployed via GitHub Pages. There is **no build step, package manager, backend, or database** — no `package.json`, lockfiles, or dependencies to install. The update script is intentionally a no-op.

### Sync (Home-PC ↔ Notebook)

Same pattern as Project Phoenix — scripts live in this repo root:

| When | File | Action |
|------|------|--------|
| Before work | `Sync-Start.cmd` | `git pull --ff-only` (aborts if dirty) |
| After work | `Sync-Ende.cmd` | commit (prompt or timestamp) + `git push` → GitHub Pages |

If this clone sits under Project Phoenix, you can also use `Sync-Website-Start.cmd` / `Sync-Website-Ende.cmd` in the Phoenix root (thin launchers into this folder).

Do not delete `.well-known/nostr.json` or `bots/` without intent (NIP-05 + bot avatars). The Nostr marketing page (`nostr.html`) renders bots from `bots/catalog.json` via `js/bots-catalog.js` — update the catalog (or run `Nostr_Bot_Army/tools/export_website_bots_catalog.py`) when bots change; do not hardcode bot cards again.

Legal pages: `impressum.html`, `datenschutz.html` (linked from footer). SEO hygiene: `sitemap.xml`, `robots.txt`, `favicon.svg`, plus canonical/OG/Twitter tags on HTML pages.

SEO clusters (Phase 4): hub pages `thema-bitcoin-kaufen-schweiz.html`, `thema-bitcoin-steuern-schweiz.html`, `thema-hardware-wallet.html`, `thema-bitcoin-akzeptieren-kmu.html` (footer „Themen“, Wissen-Banner, Startseite). JSON-LD: FAQPage + WebSite/Person on `index.html`, FAQPage on `bitcoin-beratung-und-coaching.html`, BreadcrumbList on thema hubs.

Analytics (Phase 4): optional Plausible Analytics, off by default. Toggle via `js/site-config.js` → `window.BA_SITE.plausibleDomain` (empty string = disabled). `main.js` loads that config on `DOMContentLoaded` and injects the Plausible script only if a domain is set; documented in `datenschutz.html`. `digest.html` is an interest-only "Updates & Digest" page — no newsletter backend, just a link to follow on Nostr or an optional `mailto:` "Digest-Interesse" request (linked from footer under Community).

Booking is email-first (`mailto:` with templates) with stated 1–2 business day response — no Cal.com required. Merchant packages live on `haendler.html`; mentoring modules on `bitcoin-beratung-und-coaching.html`. Articles end with related links + coaching CTA. **Ansprache:** Bildung & Mentoring = **du**; Händler/KMU = **Sie** (siehe Impressum).

Learning paths: `lernpfade.html` (Beginner → Deep Dive). Wissen supports category + level filters. Glossar is the term hub; Empfehlungen lists tools/podcasts/meetups with affiliate disclosure.

Design system lives in `css/tokens.css`, `css/site.css`, `css/article.css`, `css/home.css` (shared chrome, buttons, cards, `.side-room` callout). Display + body font: **DM Sans** (no Outfit/Syne — both looked optisch „in die Breite“). Never use `-webkit-background-clip: text` + transparent fill on headings (clips descenders g/y/p). Prefer linking shared CSS over duplicating per-page nav/footer/button CSS in a `<style>` block. Mobile nav is owned by `navbar.html` (`.nav-inner` + CSS hamburger) and `css/site.css` (`max-width: 900px`); do not reintroduce `clip-path` menus or `minmax(400px, …)` grids.

**Diagramme (Phase J):** wiederverwendbare SVGs unter `Images/diagrams/`; einbinden mit `<figure class="diagram-figure">` + `figcaption` (Styles in `site.css`). Keine generischen Stockfotos; Grafik erklärt, schmückt nicht. Quellen-Blöcke: `.source-cite`.

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
