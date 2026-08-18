# -*- coding: utf-8 -*-
"""Build js/search-index.json from HTML pages (run from website root)."""
from __future__ import annotations

import datetime
import html
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote


class Stripper(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []
        self.skip = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in ("script", "style"):
            self.skip += 1

    def handle_endtag(self, tag: str) -> None:
        if tag in ("script", "style") and self.skip:
            self.skip -= 1

    def handle_data(self, data: str) -> None:
        if not self.skip:
            self.parts.append(data)


def text_of(s: str) -> str:
    p = Stripper()
    try:
        p.feed(s)
    except Exception:
        pass
    return re.sub(r"\s+", " ", " ".join(p.parts)).strip()


def meta_desc(raw: str) -> str:
    m = re.search(
        r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']',
        raw,
        re.I | re.S,
    )
    if not m:
        m = re.search(
            r'<meta[^>]+content=["\'](.*?)["\'][^>]+name=["\']description["\']',
            raw,
            re.I | re.S,
        )
    return html.unescape(m.group(1).strip()) if m else ""


def h1(raw: str) -> str:
    m = re.search(r"<h1[^>]*>(.*?)</h1>", raw, re.I | re.S)
    return text_of(m.group(1)) if m else ""


def title_tag(raw: str) -> str:
    m = re.search(r"<title>(.*?)</title>", raw, re.I | re.S)
    return text_of(m.group(1)) if m else ""


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    skip = {"navbar.html", "footer.html"}
    entries: list[dict] = []

    for path in sorted(root.glob("*.html")):
        if path.name in skip:
            continue
        raw = path.read_text(encoding="utf-8", errors="replace")
        url = "/" if path.name == "index.html" else f"/{path.name}"
        title = h1(raw) or title_tag(raw)
        for s in (" – Bitcoin Akzeptieren", " - Bitcoin Akzeptieren"):
            if title.endswith(s):
                title = title[: -len(s)].strip()
        desc = meta_desc(raw)
        cats = re.findall(r"Kategorie:\s*([^<]+)", raw)
        levels = re.findall(r"Level:\s*([^<]+)", raw)
        cat = cats[0].strip() if cats else ""
        level = levels[0].strip() if levels else ""
        body = text_of(raw)[:1400]
        name = path.name
        if name.startswith("artikel-"):
            typ = "Artikel"
        elif name.startswith("thema-"):
            typ = "Themen-Hub"
        elif name.startswith("case-") or name == "fallstudien.html":
            typ = "Fallstudie"
        elif name in ("dca-rechner.html", "sats-converter.html"):
            typ = "Tool"
        elif name == "glossar.html":
            typ = "Glossar"
        elif name in ("bitcoin-beratung-und-coaching.html", "haendler.html"):
            typ = "Angebot"
        elif name == "lernpfade.html":
            typ = "Lernpfad"
        else:
            typ = "Seite"
        h2s = [text_of(x) for x in re.findall(r"<h2[^>]*>(.*?)</h2>", raw, re.I | re.S)]
        kw = re.sub(r"[-_]", " ", name.replace(".html", "")).split()
        keywords = list(
            dict.fromkeys([k for k in kw if len(k) > 2] + h2s[:10] + ([cat] if cat else []))
        )
        boost = 1.25 if typ in ("Artikel", "Themen-Hub", "Tool", "Angebot") else 1.0
        if name in ("wissen.html", "lernpfade.html", "glossar.html"):
            boost = 1.15
        entries.append(
            {
                "url": url,
                "title": title,
                "type": typ,
                "category": cat or typ,
                "level": level,
                "description": desc[:300],
                "keywords": keywords[:24],
                "body": body,
                "boost": boost,
            }
        )

    gloss = root / "glossar.html"
    if gloss.exists():
        graw = gloss.read_text(encoding="utf-8", errors="replace")
        for m in re.finditer(
            r'<h3 class="term-title">(.*?)</h3>\s*<p class="term-desc">(.*?)</p>',
            graw,
            re.I | re.S,
        ):
            term = text_of(m.group(1))
            desc = text_of(m.group(2))
            entries.append(
                {
                    "url": f"/glossar.html?q={quote(term)}",
                    "title": term,
                    "type": "Begriff",
                    "category": "Glossar",
                    "level": "",
                    "description": desc[:260],
                    "keywords": [term, "glossar", "definition"],
                    "body": desc[:500],
                    "boost": 1.4,
                }
            )

    placeholders = [
        "Seed Phrase sichern",
        "Bitcoin Steuern Schweiz",
        "Lightning fuer KMU",
        "Hardware Wallet BitBox",
        "Self-Custody",
        "UTXO Gebuehren",
        "Was ist Nostr?",
        "Full Node",
        "Watch-only Wallet",
        "DCA Sparplan",
        "Multisig 2-von-3",
        "KYC Privacy",
    ]
    out = {
        "version": 1,
        "generated": datetime.date.today().isoformat(),
        "placeholders": placeholders,
        "entries": entries,
    }
    out_path = root / "js" / "search-index.json"
    out_path.parent.mkdir(exist_ok=True)
    out_path.write_text(
        json.dumps(out, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    # verify
    out_path.read_bytes().decode("utf-8")
    print(f"OK {len(entries)} entries -> {out_path}")


if __name__ == "__main__":
    main()
