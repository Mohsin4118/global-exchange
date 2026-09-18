#!/usr/bin/env python3
"""Task 41 — admin API helper: update demo client's Source of Funds."""
import json, sys, urllib.request

def admin_token():
    body = json.dumps({"action": "admin-login", "email": "super@cryptowiseuk.com", "password": "Super@2026"}).encode()
    req = urllib.request.Request("http://localhost:3000/api/auth", data=body, headers={"Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req))["token"]

def update_sof(sof: str):
    token = admin_token()
    payload = json.dumps({"action": "update-client", "id": "demo-client", "patch": {"sourceOfFunds": sof}}).encode()
    req = urllib.request.Request("http://localhost:3000/api/admin", data=payload,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    res = json.load(urllib.request.urlopen(req))
    snap = res.get("snapshot") or {}
    clients = snap.get("clients") or []
    demo = next((c for c in clients if c.get("id") == "demo-client"), {})
    print("ok:", res.get("ok"), "| sof now:", (demo.get("sourceOfFunds") or "")[:80])

if __name__ == "__main__":
    update_sof(sys.argv[1])
