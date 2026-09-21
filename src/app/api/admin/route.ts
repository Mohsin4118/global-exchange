/* ------------------------------------------------------------------ */
/*  /api/admin — Super Admin API (admin token required for everything) */
/*  ONE source of truth: every action mutates the server DB and        */
/*  returns the FULL fresh snapshot, so every tab is rebuilt from the  */
/*  same records. Balances are recomputed from the ledger on every     */
/*  read, so create/edit/delete of transactions updates statistics,    */
/*  client dashboards, balances and reports at once.                   */
/* ------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import {
  adminSnapshot,
  db,
  hashPassword,
  inFlight,
  mutate,
  newReference,
  pushAudit,
  pushNotification,
  removeSessionsFromData,
  requireAdmin,
  round2,
  stamp,
  uid,
  verifyPassword,
} from "@/lib/server/db";
import type { AdminAction, Client, Tx, TxEvent } from "@/lib/shared-types";
import { CURRENCIES, DEFAULT_FX } from "@/lib/shared-types";

export const dynamic = "force-dynamic";

function bearer(req: NextRequest): string | null {
  const header = req.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(bearer(req))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, snapshot: adminSnapshot() });
}

export async function POST(req: NextRequest) {
  const adminToken = bearer(req);
  if (!requireAdmin(adminToken)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: AdminAction;
  try {
    body = (await req.json()) as AdminAction;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  const data = db();

  /* ---------------- clients ---------------- */

  if (body.action === "create-client") {
    const input = body.client;
    const email = input.email.trim().toLowerCase();
    if (!input.name.trim() || !email || input.password.length < 6) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
    }
    if (data.clients.some((c) => c.email.toLowerCase() === email)) {
      return NextResponse.json({ ok: false, error: "taken" }, { status: 409 });
    }
    mutate((d) => {
      const id = uid("c");
      const opening = round2(Math.max(0, Number(input.openingBalance) || 0));
      d.clients.unshift({
        id,
        accountNo: `CW-${Math.floor(100000 + Math.random() * 900000)}`,
        name: input.name.trim(),
        email,
        passwordHash: hashPassword(input.password),
        phone: input.phone?.trim() ?? "",
        country: input.country?.trim() ?? "",
        address: input.address?.trim() ?? "",
        city: input.city?.trim() ?? "",
        postcode: input.postcode?.trim() ?? "",
        openingBalance: 0,
        holdings: [],
        tier: opening >= 500000 ? "Private" : opening >= 100000 ? "Premium" : "Standard",
        status: "active",
        kycStatus: "unverified",
        agent: "Super Admin",
        managerNote: "",
        sourceOfFunds: input.sourceOfFunds?.trim() ?? "",
        currency: "USD",
        createdAtISO: new Date().toISOString().slice(0, 10),
      });
      if (opening > 0) {
        d.txs.unshift({
          id: uid("tx"),
          clientId: id,
          dateISO: new Date().toISOString().slice(0, 10),
          kind: "opening",
          type: "CREDIT",
          amount: opening,
          label: "Account opening deposit",
          status: "COMPLETED",
          reference: newReference(),
          method: "Bank Transfer",
          notes: "—",
          createdAtISO: new Date().toISOString(),
          updatedAtISO: new Date().toISOString(),
        });
      }
      pushNotification(d, {
        audience: "admin",
        title: "New Client Registration",
        body: `${input.name.trim()} has been created by Super Admin.`,
        kind: "registration",
      });
      pushNotification(d, {
        audience: id,
        title: "Welcome to CryptoWise",
        body: `Your private portal is live. Sign in with ${email} — your dedicated manager is one tap away.`,
        kind: "account",
      });
      pushAudit(d, "Create Client", "USER", JSON.stringify({ email, name: input.name.trim(), openingBalance: opening, portalAccess: true }));
    });
    return NextResponse.json({ ok: true, snapshot: adminSnapshot() });
  }

  /* ------------------------------------------------------------------ */
  /*  ACCOUNT REQUESTS — the public registration pipeline. A request is  */
  /*  created PENDING by /api/auth client-register. Approve provisions   */
  /*  a real client account (status active) with the credentials chosen  */
  /*  at sign-up; reject stores the decision. Neither action ever runs   */
  /*  automatically — and the SAME records drive the notifications, the  */
  /*  request list, the audit trail and the client list.                 */
  /* ------------------------------------------------------------------ */
  if (body.action === "approve-request" || body.action === "reject-request") {
    const target = data.accountRequests.find((r) => r.id === body.id);
    if (!target) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
    if (target.status !== "pending") {
      return NextResponse.json({ ok: false, error: "already-reviewed" }, { status: 409 });
    }
    if (body.action === "approve-request") {
      if (data.clients.some((c) => c.email.toLowerCase() === target.email.toLowerCase())) {
        return NextResponse.json({ ok: false, error: "taken" }, { status: 409 });
      }
      mutate((d) => {
        const request = d.accountRequests.find((r) => r.id === body.id)!;
        const id = uid("c");
        d.clients.unshift({
          id,
          accountNo: `CW-${Math.floor(100000 + Math.random() * 900000)}`,
          name: request.name,
          email: request.email,
          passwordHash: request.passwordHash, // credentials chosen at registration
          phone: request.phone,
          country: request.country,
          address: request.address,
          city: "",
          postcode: "",
          openingBalance: 0,
          holdings: [],
          tier: "Standard",
          status: "active",
          kycStatus: "unverified",
          agent: "Super Admin",
          managerNote: "",
          sourceOfFunds: "",
          currency: "USD",
          createdAtISO: new Date().toISOString().slice(0, 10),
        });
        request.status = "approved";
        request.reviewedAtISO = new Date().toISOString();
        request.reviewedBy = "Super Admin";
        request.clientId = id;
        pushNotification(d, {
          audience: id,
          title: "Account approved",
          body: "Your account request has been approved. You can now sign in with your email and password.",
          kind: "account",
        });
        pushNotification(d, {
          audience: "admin",
          title: "Account Request Approved",
          body: `${request.name} (${request.email}) was approved and added to Clients.`,
          kind: "registration",
        });
        pushAudit(d, "Approve Account Request", "USER", JSON.stringify({ requestId: request.id, email: request.email, name: request.name, newClientId: id, status: "approved" }));
      });
      return NextResponse.json({ ok: true, snapshot: adminSnapshot() });
    }
    const reason = body.reason?.trim().slice(0, 300);
    mutate((d) => {
      const request = d.accountRequests.find((r) => r.id === body.id)!;
      request.status = "rejected";
      request.reviewedAtISO = new Date().toISOString();
      request.reviewedBy = "Super Admin";
      if (reason) request.rejectReason = reason;
      pushNotification(d, {
        audience: "admin",
        title: "Account Request Rejected",
        body: `${request.name} (${request.email}) was rejected. No client account was created.`,
        kind: "registration",
      });
      pushAudit(d, "Reject Account Request", "USER", JSON.stringify({ requestId: request.id, email: request.email, name: request.name, status: "rejected", ...(reason ? { reason } : {}) }));
    });
    return NextResponse.json({ ok: true, snapshot: adminSnapshot() });
  }

  if (body.action === "update-client") {
    const target = data.clients.find((c) => c.id === body.id);
    if (!target) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
    const patch = body.patch;
    const nextEmail = patch.email?.trim().toLowerCase();
    if (nextEmail && nextEmail !== target.email.toLowerCase() && data.clients.some((c) => c.id !== target.id && c.email.toLowerCase() === nextEmail)) {
      return NextResponse.json({ ok: false, error: "taken" }, { status: 409 });
    }
    if (patch.password !== undefined && patch.password.length > 0 && patch.password.length < 6) {
      return NextResponse.json({ ok: false, error: "weak" }, { status: 400 });
    }
    mutate((d) => {
      const record = d.clients.find((c) => c.id === body.id)!;
      const old: Record<string, unknown> = {};
      const next: Record<string, unknown> = {};
      if (patch.name !== undefined && patch.name.trim()) (old.name = record.name), (next.name = patch.name.trim()), (record.name = patch.name.trim());
      if (nextEmail) (old.email = record.email), (next.email = nextEmail), (record.email = nextEmail);
      if (patch.password) {
        record.passwordHash = hashPassword(patch.password);
        removeSessionsFromData(d, { clientId: record.id });
        next.password = "reset";
        next.sessions = "revoked";
      }
      if (patch.phone !== undefined) (old.phone = record.phone), (next.phone = patch.phone), (record.phone = patch.phone.trim());
      if (patch.country !== undefined) (old.country = record.country), (next.country = patch.country), (record.country = patch.country.trim());
      if (patch.address !== undefined) (old.address = record.address), (next.address = patch.address), (record.address = patch.address.trim());
      if (patch.city !== undefined) (old.city = record.city), (next.city = patch.city), (record.city = patch.city.trim());
      if (patch.postcode !== undefined) (old.postcode = record.postcode), (next.postcode = patch.postcode), (record.postcode = patch.postcode.trim());
      if (patch.accountNo !== undefined && patch.accountNo.trim()) (old.accountNo = record.accountNo), (next.accountNo = patch.accountNo.trim()), (record.accountNo = patch.accountNo.trim());
      if (patch.agent !== undefined) (old.agent = record.agent), (next.agent = patch.agent), (record.agent = patch.agent.trim());
      if (patch.tier !== undefined) (old.tier = record.tier), (next.tier = patch.tier), (record.tier = patch.tier);
      if (patch.status !== undefined) (old.status = record.status), (next.status = patch.status), (record.status = patch.status);
      if (patch.kycStatus !== undefined) (old.kycStatus = record.kycStatus), (next.kycStatus = patch.kycStatus), (record.kycStatus = patch.kycStatus);
      if (patch.managerNote !== undefined) (old.managerNote = record.managerNote), (next.managerNote = patch.managerNote), (record.managerNote = patch.managerNote);
      if (patch.sourceOfFunds !== undefined) (old.sourceOfFunds = record.sourceOfFunds), (next.sourceOfFunds = patch.sourceOfFunds), (record.sourceOfFunds = patch.sourceOfFunds);
      if (patch.currency !== undefined && CURRENCIES.includes(patch.currency)) (old.currency = record.currency), (next.currency = patch.currency), (record.currency = patch.currency);
      if (patch.openingBalance !== undefined) {
        const value = round2(Math.max(0, Number(patch.openingBalance) || 0));
        (old.openingBalance = record.openingBalance), (next.openingBalance = value), (record.openingBalance = value);
      }
      if (patch.holdings !== undefined) {
        record.holdings = patch.holdings.filter((h) => h.units > 0 && Number.isFinite(h.units));
        next.holdings = record.holdings.length;
      }
      // keep sessions' email binding intact — sessions store the client id
      pushAudit(d, "Update Client", "USER", JSON.stringify(next), Object.keys(old).length ? JSON.stringify(old) : undefined);
    });
    return NextResponse.json({ ok: true, snapshot: adminSnapshot() });
  }

  if (body.action === "delete-client") {
    const target = data.clients.find((c) => c.id === body.id);
    if (!target) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
    if (target.isDemo) return NextResponse.json({ ok: false, error: "demo-protected" }, { status: 403 });
    mutate((d) => {
      d.clients = d.clients.filter((c) => c.id !== body.id);
      d.txs = d.txs.filter((t) => t.clientId !== body.id);
      d.notifications = d.notifications.filter((n) => n.audience !== body.id);
      d.comments = d.comments.filter((c) => c.clientId !== body.id);
      d.sessions = d.sessions.filter((s) => s.clientId !== body.id); // kill the client's session
      pushAudit(d, "Delete Client", "USER", JSON.stringify({ email: target.email, name: target.name, accountNo: target.accountNo }));
    });
    return NextResponse.json({ ok: true, snapshot: adminSnapshot() });
  }

  /* ---------------- transactions ---------------- */

  if (body.action === "create-transaction") {
    const input = body.tx;
    const client = data.clients.find((c) => c.id === input.clientId);
    if (!client) return NextResponse.json({ ok: false, error: "client-not-found" }, { status: 404 });
    const amount = round2(Number(input.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: "amount" }, { status: 400 });
    }
    const nowISO = new Date().toISOString();
    const tx: Tx = {
      id: uid("tx"),
      clientId: client.id,
      dateISO: input.dateISO || nowISO.slice(0, 10),
      kind: input.kind,
      type: input.type,
      amount,
      label: input.label?.trim() || (input.type === "CREDIT" ? "Credit" : "Debit"),
      asset: input.asset?.trim() || undefined,
      status: input.status ?? "COMPLETED",
      reference: newReference(),
      method: input.method?.trim() || "Bank Transfer",
      notes: input.notes?.trim() || "—",
      createdAtISO: nowISO,
      updatedAtISO: nowISO,
    };
    mutate((d) => {
      d.txs.unshift(tx);
      pushNotification(d, {
        audience: client.id,
        title: input.type === "CREDIT" ? "Funds credited" : "Funds debited",
        body: `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} was ${input.type === "CREDIT" ? "credited to" : "debited from"} your account by your account manager.`,
        kind: "info",
      });
      pushAudit(d, "Create Transaction", "TRANSACTION", JSON.stringify({ clientId: client.id, client: client.name, type: input.type, amount, reference: tx.reference, status: tx.status }));
      tx.history = [{ at: nowISO, by: "Super Admin", byRole: "admin", from: null, to: tx.status, note: "Posted" }];
    });
    return NextResponse.json({ ok: true, snapshot: adminSnapshot() });
  }

  if (body.action === "update-transaction") {
    const target = data.txs.find((t) => t.id === body.id);
    if (!target) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
    const patch = body.patch;
    if (patch.amount !== undefined && (!Number.isFinite(Number(patch.amount)) || Number(patch.amount) <= 0)) {
      return NextResponse.json({ ok: false, error: "amount" }, { status: 400 });
    }
    mutate((d) => {
      const record = d.txs.find((t) => t.id === body.id)!;
      const old: Record<string, unknown> = {};
      const next: Record<string, unknown> = {};
      if (patch.dateISO && patch.dateISO !== record.dateISO) (old.date = record.dateISO), (next.date = patch.dateISO), (record.dateISO = patch.dateISO);
      if (patch.kind) (old.kind = record.kind), (next.kind = patch.kind), (record.kind = patch.kind);
      if (patch.type) (old.type = record.type), (next.type = patch.type), (record.type = patch.type);
      if (patch.amount !== undefined) {
        const value = round2(Number(patch.amount));
        (old.amount = record.amount), (next.amount = value), (record.amount = value);
      }
      if (patch.status) (old.status = record.status), (next.status = patch.status), (record.status = patch.status);
      if (patch.label !== undefined) (old.label = record.label), (next.label = patch.label), (record.label = patch.label.trim() || record.label);
      if (patch.asset !== undefined) (old.asset = record.asset), (next.asset = patch.asset), (record.asset = patch.asset.trim() || undefined);
      if (patch.destination !== undefined) (old.destination = record.destination), (next.destination = patch.destination), (record.destination = patch.destination.trim() || undefined);
      if (patch.adminNote !== undefined) record.adminNote = patch.adminNote.trim() || undefined;
      if (patch.method !== undefined) record.method = patch.method.trim() || record.method;
      if (patch.notes !== undefined) record.notes = patch.notes.trim() || "—";
      record.updatedAtISO = new Date().toISOString();
      // per-request audit trail (#30): record which fields the admin edited
      const changed = Object.keys(next);
      if (changed.length > 0) {
        record.history = [
          ...(record.history ?? []),
          { at: new Date().toISOString(), by: "Super Admin", byRole: "admin", from: record.status, to: record.status, changes: changed } as TxEvent,
        ];
        // keep the client in sync when client-visible request details change (#33)
        const owner = d.clients.find((c) => c.id === record.clientId);
        if (owner && changed.some((k) => ["amount", "asset", "destination", "dateISO"].includes(k))) {
          pushNotification(d, {
            audience: owner.id,
            title: "Request updated",
            body: `The details of your request ${record.reference} were updated by your account manager. Open it under Transactions to review.`,
            kind: "info",
          });
        }
      }
      pushAudit(d, "Update Transaction", "TRANSACTION", JSON.stringify(next), Object.keys(old).length ? JSON.stringify(old) : undefined);
    });
    return NextResponse.json({ ok: true, snapshot: adminSnapshot() });
  }

  if (body.action === "delete-transaction") {
    const target = data.txs.find((t) => t.id === body.id);
    if (!target) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
    mutate((d) => {
      d.txs = d.txs.filter((t) => t.id !== body.id);
      // the client must see the correct state after an admin removal (#33/#37)
      const owner = d.clients.find((c) => c.id === target.clientId);
      if (owner && inFlight(target.status)) {
        pushNotification(d, {
          audience: owner.id,
          title: "Request removed",
          body: `Your ${target.kind} request ${target.reference} has been removed by your account manager. No funds were moved.`,
          kind: "info",
        });
      }
      pushAudit(d, "Delete Transaction", "TRANSACTION", JSON.stringify({ reference: target.reference, client: d.clients.find((c) => c.id === target.clientId)?.name, type: target.type, amount: target.amount, status: target.status }));
    });
    return NextResponse.json({ ok: true, snapshot: adminSnapshot() });
  }

  /* ------------------------------------------------------------------ */
  /*  REQUEST STATUS DECISION (#28/#29/#30/#34) — admin-only. Records    */
  /*  an immutable history entry (previous → new status, actor, notes),  */
  /*  notifies the client with the reference, and writes a global audit  */
  /*  entry. Balances react automatically because they are computed      */
  /*  from the ledger (only COMPLETED moves money — #31).                */
  /* ------------------------------------------------------------------ */
  if (body.action === "set-transaction-status") {
    const target = data.txs.find((t) => t.id === body.id);
    if (!target) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
    const VALID: readonly string[] = ["COMPLETED", "PENDING", "UNDER_REVIEW", "APPROVED", "PROCESSING", "REJECTED", "CANCELLED"];
    if (!VALID.includes(body.status)) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
    }
    const client = data.clients.find((c) => c.id === target.clientId);
    const clientNote = body.note?.trim().slice(0, 400) || undefined;
    const internalNote = body.internalNote?.trim().slice(0, 400) || undefined;
    mutate((d) => {
      const record = d.txs.find((t) => t.id === body.id)!;
      const old = record.status;
      if (old === body.status) return; // no-op — never duplicate history entries
      record.status = body.status;
      record.updatedAtISO = new Date().toISOString();
      record.history = [
        ...(record.history ?? []),
        {
          at: new Date().toISOString(),
          by: "Super Admin",
          byRole: "admin",
          from: old,
          to: body.status,
          ...(clientNote ? { note: clientNote } : {}),
          ...(internalNote ? { internalNote } : {}),
        } as TxEvent,
      ];
      if (client) {
        const amountLabel = `$${record.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
        const statusLine: Record<string, string> = {
          UNDER_REVIEW: "is now under review",
          APPROVED: "has been approved and is being processed",
          PROCESSING: "is being processed",
          COMPLETED: "has been completed",
          REJECTED: "was reviewed and could not be completed",
          CANCELLED: "has been cancelled",
          PENDING: "is pending review again",
        };
        pushNotification(d, {
          audience: client.id,
          title: `Request ${record.reference} — ${body.status.replace("_", " ").toLowerCase()}`,
          body: `Your ${record.kind} request ${record.reference} of ${amountLabel} ${statusLine[body.status] ?? `is now ${body.status.toLowerCase()}`}.${clientNote ? ` Note from your account manager: ${clientNote}` : ""}`,
          kind: record.kind === "withdrawal" ? "withdrawal" : record.kind === "deposit" ? "deposit" : "info",
        });
      }
      pushAudit(d, record.kind === "withdrawal" ? "Update Withdrawal" : "Update Transaction", record.kind === "withdrawal" ? "WITHDRAWAL" : "TRANSACTION", JSON.stringify({ reference: record.reference, client: client?.name, status: body.status, ...(clientNote ? { note: clientNote } : {}), ...(internalNote ? { internalNote } : {}) }), JSON.stringify({ status: old }));
    });
    return NextResponse.json({ ok: true, snapshot: adminSnapshot() });
  }

  /* ---------------- notifications & comments ---------------- */

  if (body.action === "send-notification") {
    if (!body.title.trim()) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
    mutate((d) => {
      if (body.clientId === "all") {
        for (const c of d.clients) {
          pushNotification(d, { audience: c.id, title: body.title.trim(), body: body.body.trim(), kind: "info" });
        }
      } else {
        pushNotification(d, { audience: body.clientId, title: body.title.trim(), body: body.body.trim(), kind: "info" });
      }
      pushAudit(d, "Send Notification", "NOTIFICATION", JSON.stringify({ to: body.clientId, title: body.title.trim() }));
    });
    return NextResponse.json({ ok: true, snapshot: adminSnapshot() });
  }

  if (body.action === "mark-read" || body.action === "mark-all-read") {
    mutate((d) => {
      for (const n of d.notifications) {
        if (body.action === "mark-all-read" || n.id === body.id) n.unread = false;
      }
    });
    return NextResponse.json({ ok: true, snapshot: adminSnapshot() });
  }

  if (body.action === "add-comment") {
    if (!body.body.trim()) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
    mutate((d) => {
      d.comments.unshift({ id: uid("cm"), clientId: body.clientId, author: "Super Admin", time: stamp(), body: body.body.trim(), createdAtISO: new Date().toISOString() });
    });
    return NextResponse.json({ ok: true, snapshot: adminSnapshot() });
  }

  /* ---------------- staff ---------------- */

  if (body.action === "add-staff") {
    if (!body.name.trim() || !body.email.trim()) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
    mutate((d) => {
      d.staff = [...d.staff, { id: uid("st"), name: body.name.trim(), email: body.email.trim(), role: body.role || "Agent", status: "ACTIVE" as const, lastLogin: "—" }];
      pushAudit(d, "Create Staff", "STAFF", JSON.stringify({ email: body.email.trim(), role: body.role || "Agent", status: "ACTIVE" }));
    });
    return NextResponse.json({ ok: true, snapshot: adminSnapshot() });
  }

  if (body.action === "remove-staff") {
    const member = data.staff.find((m) => m.id === body.id);
    if (!member) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
    if (member.you) return NextResponse.json({ ok: false, error: "self" }, { status: 400 });
    mutate((d) => {
      d.staff = d.staff.filter((m) => m.id !== body.id);
      pushAudit(d, "Update Staff", "STAFF", JSON.stringify({ email: member.email, removed: true }));
    });
    return NextResponse.json({ ok: true, snapshot: adminSnapshot() });
  }

  /* ---------------- admin password ---------------- */

  if (body.action === "change-admin-password") {
    const admin = data.adminUser;
    if (!verifyPassword(body.current, admin.passwordHash)) {
      return NextResponse.json({ ok: false, error: "wrong-current" }, { status: 400 });
    }
    if (body.next.length < 8) return NextResponse.json({ ok: false, error: "weak" }, { status: 400 });
    mutate((d) => {
      d.adminUser.passwordHash = hashPassword(body.next);
      removeSessionsFromData(d, { adminEmail: d.adminUser.email }, adminToken);
      pushAudit(d, "Change Password", "SESSION", '{"target":"admin account","sessions":"revoked"}');
    });
    return NextResponse.json({ ok: true, snapshot: adminSnapshot() });
  }

  /* ---------------- currency reference rates (admin-managed) ---------------- */

  if (body.action === "set-rates") {
    const incoming = body.rates ?? {};
    const clean: Record<string, number> = {};
    for (const code of CURRENCIES) {
      if (code === "USD") {
        clean[code] = 1; // the ledger base — locked
        continue;
      }
      const raw = Number(incoming[code]);
      clean[code] = Number.isFinite(raw) && raw > 0 ? Math.round(raw * 100000) / 100000 : (data.fx[code] ?? DEFAULT_FX[code]);
    }
    mutate((d) => {
      d.fx = clean;
      pushAudit(d, "Update Rates", "TRANSACTION", JSON.stringify(clean));
    });
    return NextResponse.json({ ok: true, snapshot: adminSnapshot() });
  }

  void mutate;
  void pushAudit;
  void pushNotification;
  void round2;
  void stamp;
  void db;
  void adminSnapshot;
  const _unused: Client[] = data.clients;
  void _unused;
  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
