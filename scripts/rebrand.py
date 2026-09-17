#!/usr/bin/env python3
"""Global rebrand: Global Exchange / globexchange.co.uk -> CryptoWise / cryptowiseuk.com"""
import pathlib

ROOT = pathlib.Path("/home/z/my-project")
FILES = [
    "src/lib/i18n.ts",
    "src/lib/admin-data.ts",
    "src/lib/admin-auth.ts",
    "src/components/site/admin-views.tsx",
    "src/components/site/icons.tsx",
    "src/components/site/closing-sections.tsx",
    "src/components/site/header.tsx",
    "src/components/site/hero.tsx",
    "src/components/admin/shell.tsx",
    "src/components/admin/misc.tsx",
    "src/app/layout.tsx",
    "src/app/page.tsx",
    "README.md",
]

REPLACEMENTS = [
    ("Global Exchange Ltd", "CryptoWise UK Ltd"),
    ("Global Exchange", "CryptoWise"),
    ("globexchange.co.uk", "cryptowiseuk.com"),
    ("جلوبال إكستشينج", "كريبتو وايز"),
    # Title casing fixes for display strings
    ("CryptoWise | Trade", "CryptoWise | Trade"),
]

changed = {}
for rel in FILES:
    p = ROOT / rel
    if not p.exists():
        continue
    text = p.read_text(encoding="utf-8")
    orig = text
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    if text != orig:
        p.write_text(text, encoding="utf-8")
        changed[rel] = sum(orig.count(o) - text.count(n) for o, n in [("Global Exchange", ""), ("globexchange.co.uk", ""), ("جلوبال إكستشينج", "")])

for rel, n in changed.items():
    print(f"updated: {rel}")

# Verify no leftovers in src/
leftover = []
for p in (ROOT / "src").rglob("*.ts*"):
    t = p.read_text(encoding="utf-8", errors="ignore")
    if "globexchange" in t.lower() or "Global Exchange" in t:
        leftover.append(str(p.relative_to(ROOT)))
print("LEFTOVER:", leftover or "none")
