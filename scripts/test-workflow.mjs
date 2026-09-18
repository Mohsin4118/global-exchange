/* ------------------------------------------------------------------ */
/*  Task 39 — FULL workflow test: REQUEST → ADMIN REVIEW → STATUS      */
/*  Runs entirely against the live API on localhost:3000.             */
/* ------------------------------------------------------------------ */
const BASE = "http://localhost:3000";
let passed = 0;
const ok = (cond, label) => {
  if (!cond) {
    console.error(`FAIL: ${label}`);
    process.exit(1);
  }
  passed++;
  console.log(`  ✓ ${label}`);
};
const j = async (res) => ({ status: res.status, ...(await res.json().catch(() => ({}))) });
const post = (url, body, token) =>
  fetch(BASE + url, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) }).then(j);
const get = (url, token) => fetch(BASE + url, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(j);

(async () => {
  console.log("— 1/8 Client A signs in —");
  const a = await post("/api/auth", { action: "client-login", email: "demo@cryptowiseuk.com", password: "Demo@2026" });
  ok(a.ok && a.token, "client A authenticated");
  const A = a.token;
  let view = await get("/api/client", A);
  ok(view.ok, "client view served");
  const balBefore = view.financials.balance;
  const availBefore = view.financials.available;

  console.log("— 2/8 Client submits a deposit REQUEST (#26/#27) —");
  const r1 = await post("/api/client", { action: "request-transaction", kind: "deposit", amount: 2500, asset: "USD", destination: "Bank of America ****4021", note: "Test deposit request" }, A);
  ok(r1.ok && r1.reference?.startsWith("DEP-"), `request stored with reference ${r1.reference}`);
  const ref1 = r1.reference;
  view = await get("/api/client", A);
  const tx1 = view.txs.find((t) => t.reference === ref1);
  ok(tx1 && tx1.status === "PENDING", "initial status is PENDING");
  ok(view.financials.balance === balBefore, "balance NOT changed by submitting (#31)");
  ok(view.notifications.some((n) => n.body.includes(ref1)), "client notification includes the reference (#34)");

  console.log("— 3/8 Duplicate guard (#37) —");
  const dup = await post("/api/client", { action: "request-transaction", kind: "deposit", amount: 2500, asset: "USD", destination: "Bank of America ****4021", note: "dup" }, A);
  ok(dup.status === 409 && !dup.ok, "identical in-flight request rejected");

  console.log("— 4/8 Client permission walls (#32/#36) —");
  const f1 = await post("/api/admin", { action: "set-transaction-status", id: tx1.id, status: "COMPLETED" }, A);
  ok(f1.status === 401, "client token cannot call admin endpoints");
  const f1b = await post("/api/client", { action: "set-transaction-status", id: tx1.id, status: "COMPLETED" }, A);
  ok(f1b.status === 400, "client action surface has no status mutation");
  const noTok = await get("/api/admin", null);
  ok(noTok.status === 401, "anonymous admin access rejected");

  console.log("— 5/8 Super Admin reviews & decides (#28/#29) —");
  const ad = await post("/api/auth", { action: "admin-login", email: "super@cryptowiseuk.com", password: "Super@2026" });
  ok(ad.ok && ad.token, "admin authenticated");
  const AD = ad.token;
  let snap = await get("/api/admin", AD);
  const atx1 = snap.snapshot.txs.find((t) => t.reference === ref1);
  ok(atx1 && atx1.clientName === "Alex Morgan" && atx1.status === "PENDING", "request appears in admin dashboard with client info");
  ok(snap.snapshot.stats.requestCounts.PENDING >= 1, "overview request counts live");

  const s1 = await post("/api/admin", { action: "set-transaction-status", id: tx1.id, status: "UNDER_REVIEW", note: "We are reviewing your deposit", internalNote: "Checking source of funds" }, AD);
  ok(s1.ok, "status → UNDER_REVIEW with notes");
  view = await get("/api/client", A);
  let t1 = view.txs.find((t) => t.id === tx1.id);
  ok(t1.status === "UNDER_REVIEW", "client sees UNDER_REVIEW immediately");
  const lastEv = t1.history[t1.history.length - 1];
  ok(lastEv.note === "We are reviewing your deposit", "client-visible note delivered");
  ok(lastEv.internalNote === undefined && !JSON.stringify(t1).includes("source of funds"), "internal note NOT exposed to client (#30)");

  const s2 = await post("/api/admin", { action: "set-transaction-status", id: tx1.id, status: "COMPLETED" }, AD);
  ok(s2.ok, "status → COMPLETED");
  view = await get("/api/client", A);
  ok(view.financials.balance === balBefore + 2500, "balance moved ONLY on completion (2500 credited)");
  ok(view.notifications.some((n) => n.title.includes(ref1)), "status-change notification with reference (#34)");

  console.log("— 6/8 Withdrawal: reserve → reject → release (#31) —");
  const reservedBefore = Math.round((view.financials.balance - view.financials.available) * 100) / 100; // pre-existing seed reservation
  const r2 = await post("/api/client", { action: "request-transaction", kind: "withdrawal", amount: 500, asset: "USD", destination: "IBAN GB29 NWBK 6016 1331 9268 19" }, A);
  ok(r2.ok, "withdrawal request submitted");
  const ref2 = r2.reference;
  view = await get("/api/client", A);
  ok(view.financials.available === view.financials.balance - 500 - reservedBefore, "in-flight withdrawal reserves available funds");
  const wId = view.txs.find((t) => t.reference === ref2).id;
  await post("/api/admin", { action: "set-transaction-status", id: wId, status: "REJECTED", note: "Verification incomplete" }, AD);
  view = await get("/api/client", A);
  ok(view.txs.find((t) => t.id === wId).status === "REJECTED", "client sees REJECTED");
  ok(view.financials.balance === balBefore + 2500, "rejected withdrawal never moved balance");
  ok(view.financials.available === view.financials.balance - reservedBefore, "reservation released after rejection");

  console.log("— 7/8 Client cancel (only own, only PENDING) (#32) —");
  const r3 = await post("/api/client", { action: "request-transaction", kind: "trade", amount: 1000, asset: "BTC", destination: "Buy BTC with USD" }, A);
  ok(r3.ok, "trade request submitted");
  view = await get("/api/client", A);
  const t3 = view.txs.find((t) => t.reference === r3.reference);
  const c1 = await post("/api/client", { action: "cancel-request", id: t3.id }, A);
  ok(c1.ok, "client cancelled own PENDING request");
  view = await get("/api/client", A);
  ok(view.txs.find((t) => t.id === t3.id).status === "CANCELLED", "status CANCELLED everywhere");
  const c2 = await post("/api/client", { action: "cancel-request", id: tx1.id }, A);
  ok(c2.status === 400, "cannot cancel a decided (COMPLETED) request");

  console.log("— 8/8 Client B isolation + admin edit history (#25/#33/#37) —");
  const b = await post("/api/auth", { action: "client-login", email: "sarah.johnson@example.com", password: "Sarah@2026" });
  ok(b.ok, "client B authenticated");
  const B = b.token;
  const viewB = await get("/api/client", B);
  ok(!JSON.stringify(viewB.txs).includes(ref1), "client B cannot see client A's request");
  const cross = await post("/api/client", { action: "cancel-request", id: tx1.id }, B);
  ok(cross.status === 404, "client B cannot touch client A's request id");
  const fB = await get("/api/admin", B);
  ok(fB.status === 401, "client token cannot read admin snapshot");

  const r4 = await post("/api/client", { action: "request-transaction", kind: "deposit", amount: 750, asset: "USDT", destination: "TRC-20 test" }, A);
  view = await get("/api/client", A);
  const t4 = view.txs.find((t) => t.reference === r4.reference);
  const e1 = await post("/api/admin", { action: "update-transaction", id: t4.id, patch: { amount: 900, adminNote: "Client corrected the amount" } }, AD);
  ok(e1.ok, "admin edited request details");
  view = await get("/api/client", A);
  const t4b = view.txs.find((t) => t.id === t4.id);
  ok(t4b.amount === 900, "client sees the updated amount");
  const editEv = (t4b.history ?? []).find((ev) => ev.changes);
  ok(editEv && editEv.changes.includes("amount"), "edit recorded in status history (#30)");
  ok(t4b.adminNote === undefined, "admin private note stripped from client payload");
  snap = await get("/api/admin", AD);
  ok(snap.snapshot.audit.some((x) => JSON.stringify(x).includes(ref1)), "global audit trail records the workflow");

  // persistence: statuses live in the server db — re-read confirms
  const recheck = await get("/api/client", A);
  ok(recheck.txs.find((t) => t.id === tx1.id).status === "COMPLETED", "refresh: status persists (single source of truth)");

  console.log(`\nALL ${passed} WORKFLOW CHECKS PASSED ✅`);
})().catch((e) => {
  console.error("Test crashed:", e);
  process.exit(1);
});
