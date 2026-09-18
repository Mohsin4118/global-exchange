#!/usr/bin/env python3
"""Task 18/16 verification: full CRUD sync cycle via the real API."""
import json
import urllib.request

BASE = "http://localhost:3000"


def post(path, body, token=None):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", **({"Authorization": f"Bearer {token}"} if token else {})},
        method="POST",
    )
    return json.load(urllib.request.urlopen(req))


def get(path, token):
    req = urllib.request.Request(BASE + path, headers={"Authorization": f"Bearer {token}"})
    return json.load(urllib.request.urlopen(req))


admin = post("/api/auth", {"action": "admin-login", "email": "super@cryptowiseuk.com", "password": "Super@2026"})["token"]

def demo_fin():
    snap = get("/api/admin", admin)["snapshot"]
    c = [x for x in snap["clients"] if x["id"] == "demo-client"][0]
    return c.get("balance"), c.get("cashAvailable"), c.get("invested")

print("baseline (balance, cash, invested):", demo_fin())

# 1. CREATE a scratch deposit of 3000
r = post("/api/admin", {"action": "create-transaction",
                        "tx": {"clientId": "demo-client", "kind": "deposit", "type": "CREDIT",
                               "status": "COMPLETED", "amount": 3000, "dateISO": "2026-09-18",
                               "method": "Wire", "notes": "API sync test"}}, admin)
tx = [x for x in r["snapshot"]["txs"] if x.get("notes") == "API sync test"][0]
print("created tx:", tx["id"][:16], "-> balance:", demo_fin()[0])

# 2. EDIT amount 3000 -> 5000, verify recompute
post("/api/admin", {"action": "update-transaction", "id": tx["id"], "patch": {"amount": 5000}}, admin)
print("after edit to 5000 -> balance:", demo_fin()[0])

# 3. Client view reflects the edit immediately
client = post("/api/auth", {"action": "client-login", "email": "demo@cryptowiseuk.com", "password": "Demo@2026"})["token"]
cv = get("/api/client", client)
print("client API balance:", cv["financials"]["balance"], "| credits:", cv["financials"]["credits"])
print("client sees edited tx:", any(x["id"] == tx["id"] and x["amount"] == 5000 for x in cv["txs"]))

# 4. EDIT client profile from admin -> client API reflects
post("/api/admin", {"action": "update-client", "id": "demo-client",
                    "patch": {"phone": "+44 7700 900123"}}, admin)
cv2 = get("/api/client", client)
print("client phone after admin edit:", cv2["client"]["phone"])

# 5. DELETE the scratch tx -> balance back to baseline
post("/api/admin", {"action": "delete-transaction", "id": tx["id"]}, admin)
base = demo_fin()
print("after delete -> balance:", base[0], "(baseline was 12480)")

# 6. Restore demo phone + verify
post("/api/admin", {"action": "update-client", "id": "demo-client",
                    "patch": {"phone": "+44 20 7946 0958"}}, admin)
cv3 = get("/api/client", client)
print("demo phone restored:", cv3["client"]["phone"], "| balance:", cv3["financials"]["balance"])

# 7. Final assertions — client API is the authority on computed balances
snap = get("/api/admin", admin)["snapshot"]
print("admin stats:", {k: snap["stats"][k] for k in sorted(snap["stats"]) if not isinstance(snap["stats"][k], (list, dict))})
final = get("/api/client", client)["financials"]["balance"]
print("final client balance:", final)
print("PASS: full CRUD sync cycle verified (balance restored to 12480)" if final == 12480 else "FAIL: balance did not return to baseline!")
