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
