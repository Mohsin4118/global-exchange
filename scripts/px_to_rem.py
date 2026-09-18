#!/usr/bin/env python3
"""Convert text-[Npx] arbitrary font sizes to rem equivalents across src/.

Rationale: the site gets a SLIGHT global font increase by raising the root
font-size (html { font-size: 106.25% } = 17px). rem-based utilities scale
automatically; px-based arbitrary values (text-[13px]) do not. Converting
Npx -> N/16rem keeps the EXACT same rendered size at the current 16px root
(zero visual change today) and lets every font scale uniformly after the
bump. Width/height/tracking utilities are intentionally left untouched.
"""
import re
from pathlib import Path

ROOT = Path("/home/z/my-project/src")
PATTERN = re.compile(r"text-\[(\d+(?:\.\d+)?)px\]")

def to_rem(m):
    px = float(m.group(1))
    rem = px / 16.0
    s = f"{rem:.5f}".rstrip("0").rstrip(".")
    return f"text-[{s}rem]"

total = 0
for f in sorted(ROOT.rglob("*.tsx")):
    text = f.read_text()
    new, n = PATTERN.subn(to_rem, text)
    if n:
        f.write_text(new)
        total += n
        print(f"{str(f.relative_to(ROOT.parent)):<55} {n:>4} conversions")
print(f"TOTAL: {total}")
