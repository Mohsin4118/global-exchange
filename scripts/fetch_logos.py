#!/usr/bin/env python3
"""Download official brand logos for cryptowiseuk header section.

Sources:
- Wikimedia Commons (official logo mirrors, direct upload.wikimedia.org URLs via API)
- TradingView symbol-logo CDN (for Salik Company PJSC, DFM: SALIK) - fallback candidates
"""
import json
import subprocess
import sys

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
OUT = "/home/z/my-project/public/logos"

COMMONS_FILES = {
    "bitcoin.svg": "File:Bitcoin.svg",
    "ethereum.svg": "File:Ethereum logo 2014.svg",
    "tether.svg": "File:Tether Logo.svg",
    "aramco.svg": "File:Saudi aramco logo.svg",
}

# TradingView symbol-logo CDN candidates for Salik Company PJSC (DFM: SALIK)
SALIK_CANDIDATES = [
    "https://s3-symbol-logo.tradingview.com/salik.svg",
    "https://s3-symbol-logo.tradingview.com/salik--600.png",
    "https://s3-symbol-logo.tradingview.com/salik-pjsc.svg",
    "https://s3-symbol-logo.tradingview.com/salik-company-pjsc.svg",
    "https://s3-symbol-logo.tradingview.com/salik-company.svg",
    "https://s3-symbol-logo.tradingview.com/salikco.svg",
]


def curl(url: str, out: str) -> bool:
    r = subprocess.run(
        ["curl", "-sL", "-A", UA, url, "-o", out, "--max-time", "40", "-w", "%{http_code}"],
        capture_output=True, text=True,
    )
    code = r.stdout.strip()
    return code == "200"


def commons_url(title: str) -> str | None:
    api = (
        "https://commons.wikimedia.org/w/api.php?action=query&format=json"
        f"&titles={title.replace(' ', '%20').replace(':', '%3A')}"
        "&prop=imageinfo&iiprop=url"
    )
    r = subprocess.run(["curl", "-sL", "-A", UA, api, "--max-time", "30"], capture_output=True, text=True)
    try:
        d = json.loads(r.stdout)
        for p in d["query"]["pages"].values():
            if "imageinfo" in p:
                return p["imageinfo"][0]["url"].split("?")[0]
    except Exception as e:
        print(f"  API error for {title}: {e}")
    return None


def is_svg(path: str) -> bool:
    try:
        with open(path, "rb") as f:
            head = f.read(400).decode("utf-8", "ignore")
        return "<svg" in head or "<?xml" in head
    except OSError:
        return False


def is_raster(path: str) -> bool:
    try:
        with open(path, "rb") as f:
            head = f.read(24)
        return head[:8] == b"\x89PNG\r\n\x1a\n" or head[:2] == b"\xff\xd8"
    except OSError:
        return False


ok, fail = [], []

# 1) Wikimedia Commons official logo files
for fname, title in COMMONS_FILES.items():
    url = commons_url(title)
    print(f"{title} -> {url}")
    if url and curl(url, f"{OUT}/{fname}") and is_svg(f"{OUT}/{fname}"):
        ok.append(fname)
        print(f"  saved {fname} OK")
    else:
        fail.append(fname)
        print(f"  FAILED {fname}")

# 2) Salik (TradingView CDN, official DFM issuer symbol logo)
salik_done = False
for url in SALIK_CANDIDATES:
    ext = url.rsplit(".", 1)[-1]
    out = f"{OUT}/salik.{ext}"
    if curl(url, out) and (is_svg(out) or is_raster(out)):
        print(f"Salik: {url} -> saved {out} OK")
        salik_done = True
        break
    else:
        print(f"Salik: {url} FAILED")
if not salik_done:
    print("SALIK NEEDS FALLBACK (image-search)")

print("\nOK:", ok)
print("FAIL:", fail)
sys.exit(0)
