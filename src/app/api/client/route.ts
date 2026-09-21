/* ------------------------------------------------------------------ */
/*  /api/client — client portal API (STRICT self-scoped access)        */
/*  Every request must carry a client bearer token. The server reads   */
/*  the client id from the session — NEVER from the request body — so  */
/*  URL/ID manipulation cannot reach another client's data. A client   */
/*  receives only its own profile, ledger and notifications.           */
/* ------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import { clientView, db, inFlight, mutate, pushNotification, pushAudit, removeSessionsFromData, requireClient, round2, uid, verifyPassword, hashPassword } from "@/lib/server/db";
import { CURRENCIES } from "@/lib/shared-types";
import type { ClientAction, Tx, TxEvent } from "@/lib/shared-types";

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
  const token = bearer(req);
  const client = requireClient(token);
  if (!client) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  let body: ClientAction;
  try {
    body = (await req.json()) as ClientAction;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  /* ---------------------------------------------------------------- */
  /*  TRANSACTION REQUEST (#26/#27) — a client can ONLY submit a       */
  /*  request. It is stored as a PENDING ledger entry; it NEVER moves  */
  /*  the balance (only an admin moving it to COMPLETED does, via the  */
  /*  ledger computation). The server decides the id, reference,       */
  /*  status and timestamps — the client cannot inject any of them.    */
  /* ---------------------------------------------------------------- */
  if (body.action === "request-transaction") {
    const amount = round2(Number(body.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: "amount" }, { status: 400 });
    }
    const kind: Tx["kind"] = body.kind === "withdrawal" || body.kind === "trade" ? body.kind : "deposit";
    const asset = body.asset?.trim().slice(0, 60) || undefined;
    const destination = body.destination?.trim().slice(0, 240) || undefined;
    const note = body.note?.trim().slice(0, 500) || undefined;
    const data = db();
    const fin = clientView(client.id);
    if (!fin.ok) return NextResponse.json({ ok: false, error: "gone" }, { status: 410 });
    if (kind === "withdrawal" && amount > fin.view.financials.available) {
      return NextResponse.json({ ok: false, error: "funds" }, { status: 400 });
    }
    // duplicate guard (#37): an identical open request is already being reviewed
    const duplicate = data.txs.some(
      (t) =>
        t.clientId === client.id &&
        inFlight(t.status) &&
        t.kind === kind &&
        t.amount === amount &&
        (t.asset ?? undefined) === asset &&
        (t.destination ?? undefined) === destination,
    );
    if (duplicate) {
      return NextResponse.json({ ok: false, error: "duplicate" }, { status: 409 });
    }
    const nowISO = new Date().toISOString();
    const prefix = kind === "deposit" ? "DEP" : kind === "withdrawal" ? "WDR" : "TRD";
    const reference = `${prefix}-${nowISO.slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const created: Tx = {
      id: uid("tx"),
      clientId: client.id,
      dateISO: nowISO.slice(0, 10),
      kind,
      type: kind === "deposit" ? "CREDIT" : "DEBIT",
      amount,
      label:
        kind === "deposit"
          ? "Deposit request — pending review"
          : kind === "withdrawal"
            ? "Withdrawal request — pending review"
            : "Trade request — pending review",
      asset,
      destination,
      status: "PENDING",
      reference,
      method: body.method?.trim() || (kind === "trade" ? "Market Order" : "Bank Transfer"),
      notes: note || "—",
      history: [{ at: nowISO, by: client.name, byRole: "client", from: null, to: "PENDING", note: note || undefined }],
      createdAtISO: nowISO,
      updatedAtISO: nowISO,
    };
    const amountLabel = `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    mutate((d) => {
      d.txs.unshift(created);
      pushNotification(d, {
        audience: "admin",
        title: kind === "deposit" ? "New Deposit Request" : kind === "withdrawal" ? "New Withdrawal Request" : "New Trade Request",
        body: `${client.name} (${client.accountNo}) submitted request ${reference} — ${kind} of ${amountLabel}${asset ? ` · ${asset}` : ""}.`,
        kind: kind === "deposit" ? "deposit" : kind === "withdrawal" ? "withdrawal" : "info",
      });
      pushNotification(d, {
        audience: client.id,
        title: "Request submitted",
        body: `Your ${kind} request ${reference} of ${amountLabel} has been submitted and is pending review.`,
        kind: kind === "deposit" ? "deposit" : kind === "withdrawal" ? "withdrawal" : "info",
      });
      pushAudit(d, "Create Transaction", "TRANSACTION", JSON.stringify({ reference, client: client.name, kind, amount, status: "PENDING", source: "client portal" }));
    });
    const fresh = clientView(client.id);
    return NextResponse.json({ ok: true, reference, ...(fresh.ok ? fresh.view : {}) });
  }

  /* ---------------------------------------------------------------- */
  /*  CANCEL REQUEST (#32) — the ONLY mutation a client may perform on */
  /*  a request: cancelling their OWN still-pending request. The id is */
  /*  scoped against the session client, so another client's request   */
  /*  can never be reached. Statuses beyond PENDING are admin-owned.   */
  /* ---------------------------------------------------------------- */
  if (body.action === "cancel-request") {
    const target = db().txs.find((t) => t.id === body.id && t.clientId === client.id);
    if (!target) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
    if (target.status !== "PENDING") {
      return NextResponse.json({ ok: false, error: "not-cancellable" }, { status: 400 });
    }
    const nowISO = new Date().toISOString();
    mutate((d) => {
      const record = d.txs.find((t) => t.id === body.id && t.clientId === client.id)!;
      record.status = "CANCELLED";
      record.updatedAtISO = nowISO;
      record.history = [
        ...(record.history ?? []),
        { at: nowISO, by: client.name, byRole: "client", from: "PENDING", to: "CANCELLED" } as TxEvent,
      ];
      pushNotification(d, {
        audience: "admin",
        title: "Request Cancelled by Client",
        body: `${client.name} (${client.accountNo}) cancelled their ${record.kind} request ${record.reference} of $${record.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}.`,
        kind: "info",
      });
      pushNotification(d, {
        audience: client.id,
        title: "Request cancelled",
        body: `Your ${record.kind} request ${record.reference} has been cancelled. No funds were moved.`,
        kind: "info",
      });
      pushAudit(d, "Update Transaction", "TRANSACTION", JSON.stringify({ reference: record.reference, client: client.name, from: "PENDING", to: "CANCELLED", by: "client" }));
    });
    const fresh = clientView(client.id);
    return NextResponse.json({ ok: true, ...(fresh.ok ? fresh.view : {}) });
  }

  /* ---- display-currency preference (own account only, validated server-side) ---- */
  if (body.action === "set-currency") {
    const code = body.currency;
    if (!CURRENCIES.includes(code)) {
      return NextResponse.json({ ok: false, error: "bad-currency" }, { status: 400 });
    }
    mutate((d) => {
      const record = d.clients.find((c) => c.id === client.id);
      if (record) record.currency = code;
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
      if (record) {
        record.passwordHash = hashPassword(body.next);
        removeSessionsFromData(d, { clientId: client.id }, token);
      }
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
