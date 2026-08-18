# -*- coding: utf-8 -*-
"""Validate SVG assets for pure UTF-8 encoding and valid XML syntax."""
from __future__ import annotations

import glob
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    svg_files = sorted(root.glob("**/*.svg"))
    
    # Exclude .git if any
    svg_files = [f for f in svg_files if ".git" not in f.parts]
    
    if not svg_files:
        print("Keine SVG-Dateien gefunden.")
        return 0

    errors: list[str] = []

    for svg_path in svg_files:
        rel_path = svg_path.relative_to(root)
        
        # 1. UTF-8 Validation
        try:
            raw_bytes = svg_path.read_bytes()
            content = raw_bytes.decode("utf-8")
        except UnicodeDecodeError as e:
            errors.append(f"[UTF-8 FEHLER] {rel_path}: {e}")
            continue

        # 2. XML Syntax Validation
        try:
            ET.fromstring(content)
        except ET.ParseError as e:
            errors.append(f"[XML SYNTAX FEHLER] {rel_path}: {e}")
            continue

    if errors:
        print(f"FEHLER: {len(errors)} SVG-Probleme gefunden:")
        for err in errors:
            print(f"  - {err}")
        return 1

    print(f"OK: Alle {len(svg_files)} SVG-Dateien sind sauberes UTF-8 und valides XML.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
