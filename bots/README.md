# Bot-Profilbilder (Nostr Phoenix Bot Army)

Statische PNGs fuer Kind-0-Metadaten (`picture`, `banner`).

## Struktur (URLs auf bitcoin-akzeptieren.ch)

```
bots/banner.png
bots/avatars/<bot_name>.png
```

Beispiel: `https://bitcoin-akzeptieren.ch/bots/avatars/mma_news_bot.png`

## Erzeugen

Auf dem Bot-Node (oder lokal mit Pillow):

```bash
cd /opt/nostr-bot-army
sudo -u nostrbot /opt/nostr-bot-army/.venv/bin/python tools/generate_profile_assets.py
```

Ausgabe: `/opt/nostr-bot-army/assets/profiles/`

## Veroeffentlichen (GitHub Pages)

1. PNGs von Node nach `bots/` in diesem Repo kopieren (WinSCP)
2. Commit + Push auf `main` — GitHub Pages deployt automatisch (~1–2 Min.)

`public_base_url` in Nostr_Bot_Army `config.yaml` muss `https://bitcoin-akzeptieren.ch/bots` bleiben.

## Website-Katalog (`catalog.json`)

`nostr.html` lädt `/bots/catalog.json` dynamisch (keine hardcodierten Bot-Karten).

Nach Persona-Änderungen / neuem Bot:

```bash
cd Nostr_Bot_Army
python tools/export_website_bots_catalog.py --website-root "../Website bitcoin-akzeptieren.ch/bitcoin-akzeptieren"
```

Oder beim GitHub-Publish (`publish_profile_github.py`): Avatar + `nostr.json` + Katalog-Upsert.

`pickleball` ist blockiert und gehört nicht mehr in `nostr.json` / Katalog.
`nostr_dev_bot` erscheint erst, wenn `dev` in `.well-known/nostr.json` steht und das Avatar-PNG liegt.
