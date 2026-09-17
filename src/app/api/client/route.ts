/* ------------------------------------------------------------------ */
/*  /api/client — client portal API (STRICT self-scoped access)        */
/*  Every request must carry a client bearer token. The server reads   */
/*  the client id from the session — NEVER from the request body — so  */
/*  URL/ID manipulation cannot reach another client's data. A client   */
/*  receives only its own profile, ledger and notifications.           */
/* ------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import { clientView, db, mutate, pushNotification, pushAudit, requireClient, round2, uid, verifyPassword, hashPassword } from "@/lib/server/db";
import type { ClientAction } from "@/lib/shared-types";

export const dynamic = "force-dynamic";

function bearer(req: NextRequest): string | null {
  const header = req.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

export async function GET(req: NextRequest) {
  const client = requireClient(bearer(req));
  if (!client) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const result = clientView(client.id);
  if (!result.ok) return NextResponse.json({ ok: false, error: "gone" }, { status: 410 });
  return NextResponse.json({ ok: true, ...result.view });
}

export async function POST(req: NextRequest) {
  const client = requireClient(bearer(req));
  if (!client) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  let body: ClientAction;
  try {
    body = (await req.json()) as ClientAction;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  /* ---- deposit / withdrawal request → PENDING ledger entry + admin notification ---- */
  if (body.action === "request-transaction") {
    const amount = round2(Number(body.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: "amount" }, { status: 400 });
    }
    const kind = body.kind === "withdrawal" ? "withdrawal" : "deposit";
    const data = db();
    const fin = clientView(client.id);
    if (!fin.ok) return NextResponse.json({ ok: false, error: "gone" }, { status: 410 });
    if (kind === "withdrawal" && amount > fin.view.financials.available) {
      return NextResponse.json({ ok: false, error: "funds" }, { status: 400 });
    }
    mutate((d) => {
      const nowISO = new Date().toISOString();
      d.txs.unshift({
        id: uid("tx"),
        clientId: client.id,
        dateISO: nowISO.slice(0, 10),
        kind,
        type: kind === "deposit" ? "CREDIT" : "DEBIT",
        amount,
        label: kind === "deposit" ? "Deposit request — pending review" : "Withdrawal request — pending review",
        status: "PENDING",
        reference: `${kind === "deposit" ? "DEP" : "WDR"}-${nowISO.slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`,
        method: body.method?.trim() || (kind === "deposit" ? "Bank Transfer" : "Bank Transfer"),
        notes: body.note?.trim() || "—",
        createdAtISO: nowISO,
        updatedAtISO: nowISO,
      });
      pushNotification(d, {
        audience: "admin",
        title: kind === "deposit" ? "New Deposit Request" : "New Withdrawal Request",
        body: `${client.name} (${client.accountNo}) requested a ${kind} of $${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}.`,
        kind: kind === "deposit" ? "deposit" : "withdrawal",
      });
      pushNotification(d, {
        audience: client.id,
        title: kind === "deposit" ? "Deposit request received" : "Withdrawal request received",
        body:
          kind === "deposit"
            ? `Your deposit request of $${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} is being reviewed by your account manager.`
            : `Your withdrawal request of $${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} is being reviewed by your account manager.`,
        kind: kind === "deposit" ? "deposit" : "withdrawal",
      });
    });
    const fresh = clientView(client.id);
    return NextResponse.json({ ok: true, ...(fresh.ok ? fresh.view : {}) });
  }

  /* ---- self-service profile update (contact details only) ---- */
  if (body.action === "update-profile") {
    mutate((d) => {
      const record = d.clients.find((c) => c.id === client.id);
      if (!record) return;
      if (typeof body.phone === "string") record.phone = body.phone.trim();
      if (typeof body.country === "string") record.country = body.country.trim();
      if (typeof body.address === "string") record.address = body.address.trim();
      if (typeof body.city === "string") record.city = body.city.trim();
      if (typeof body.postcode === "string") record.postcode = body.postcode.trim();
    });
    const fresh = clientView(client.id);
    return NextResponse.json({ ok: true, ...(fresh.ok ? fresh.view : {}) });
  }

  /* ---- self-service password change (current password verified server-side) ---- */
  if (body.action === "change-password") {
    if (!verifyPassword(body.current, client.passwordHash)) {
      return NextResponse.json({ ok: false, error: "wrong-current" }, { status: 400 });
    }
    if (body.next.length < 6) {
      return NextResponse.json({ ok: false, error: "weak" }, { status: 400 });
    }
    mutate((d) => {
      const record = d.clients.find((c) => c.id === client.id);
      if (record) record.passwordHash = hashPassword(body.next);
    });
    return NextResponse.json({ ok: true });
  }

  /* ---- notifications: mark read (scoped to own notifications only) ---- */
  if (body.action === "mark-read") {
    mutate((d) => {
      for (const n of d.notifications) {
        if (n.audience !== client.id) continue; // hard scope: own notifications only
        if (body.ids === "all" || body.ids.includes(n.id)) n.unread = false;
      }
    });
    const fresh = clientView(client.id);
    return NextResponse.json({ ok: true, ...(fresh.ok ? fresh.view : {}) });
  }

  void db;
  void pushAudit;
  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
