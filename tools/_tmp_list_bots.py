# -*- coding: utf-8 -*-
import json
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "bots" / "catalog.json"
data = json.loads(p.read_text(encoding="utf-8"))
for g in data["groups"]:
    print("GROUP", g["id"], "-", g["title"], "n=", len(g.get("bots", [])))
    for b in g.get("bots", []):
        dn = b.get("display_name", "")
        bl = (b.get("blurb") or "").strip()
        flags = []
        if "_" in dn:
            flags.append("UNDERSCORE")
        if not bl:
            flags.append("NO_BLURB")
        elif len(bl) < 45:
            flags.append("SHORT")
        mark = (" [" + ",".join(flags) + "]") if flags else ""
        print(" ", b["id"], "|", dn, "|", len(bl), mark)
