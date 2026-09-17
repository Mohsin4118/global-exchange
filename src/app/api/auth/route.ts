/* ------------------------------------------------------------------ */
/*  /api/auth — authentication (login / register / logout / whoami)    */
/*  Passwords are verified against scrypt hashes in the server DB.     */
/*  Successful logins issue a random bearer token bound to the         */
/*  session on the server — the client can only ever be its own user.  */
/* ------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  db,
  destroySession,
  mutate,
  pushNotification,
  pushAudit,
  publicClient,
  uid,
  verifyPassword,
  hashPassword,
} from "@/lib/server/db";
import type { AuthAction } from "@/lib/shared-types";

export const dynamic = "force-dynamic";

function bearer(req: NextRequest): string | null {
  const header = req.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

export async function GET(req: NextRequest) {
  const token = bearer(req);
  if (!token) return NextResponse.json({ authenticated: false });
  const data = db();
  const session = data.sessions.find((s) => s.token === token);
  if (!session) return NextResponse.json({ authenticated: false });
  if (session.role === "admin") {
    return NextResponse.json({ authenticated: true, role: "admin", email: session.email });
  }
  const client = data.clients.find((c) => c.id === session.clientId);
  if (!client) return NextResponse.json({ authenticated: false });
  return NextResponse.json({ authenticated: true, role: "client", client: publicClient(client) });
}

export async function POST(req: NextRequest) {
  let body: AuthAction;
  try {
    body = (await req.json()) as AuthAction;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  if (body.action === "client-login" || body.action === "admin-login") {
    const email = body.email.trim().toLowerCase();
    const password = body.password;
    const data = db();

    if (body.action === "admin-login") {
      const admin = data.adminUser;
      if (email !== admin.email || !verifyPassword(password, admin.passwordHash)) {
        return NextResponse.json({ ok: false, error: "invalid" }, { status: 401 });
      }
      const session = createSession("admin", admin.email);
      mutate((d) => pushAudit(d, "Sign In", "SESSION", '{"method":"password","mfa":false}'));
      return NextResponse.json({ ok: true, token: session.token, role: "admin" });
    }

    const client = data.clients.find((c) => c.email.toLowerCase() === email);
    if (!client || !verifyPassword(password, client.passwordHash)) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 401 });
    }
    if (client.status === "suspended") {
      return NextResponse.json({ ok: false, error: "suspended" }, { status: 403 });
    }
    const session = createSession("client", client.email, client.id);
    mutate((d) => {
      const record = d.clients.find((c) => c.id === client.id);
      if (record) record.lastLoginISO = new Date().toISOString();
    });
    return NextResponse.json({ ok: true, token: session.token, role: "client", client: publicClient(client) });
  }

  if (body.action === "client-register") {
    const email = body.email.trim().toLowerCase();
    const name = body.name.trim();
    if (!name || !email || body.password.length < 6) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
    }
    return mutate((data) => {
      if (data.clients.some((c) => c.email.toLowerCase() === email)) {
        return NextResponse.json({ ok: false, error: "taken" }, { status: 409 });
      }
      const id = uid("c");
      data.clients.unshift({
        id,
        accountNo: `CW-${Math.floor(100000 + Math.random() * 900000)}`,
        name,
        email,
        passwordHash: hashPassword(body.password),
        phone: body.phone?.trim() ?? "",
        country: "",
        address: "",
        city: "",
        postcode: "",
        openingBalance: 0,
        holdings: [],
        tier: "Standard",
        status: "active",
        kycStatus: "unverified",
        agent: "Super Admin",
        managerNote: "",
        createdAtISO: new Date().toISOString().slice(0, 10),
      });
      pushNotification(data, {
        audience: "admin",
        title: "New Client Registration",
        body: `${name} has registered on the platform.`,
        kind: "registration",
      });
      pushNotification(data, {
        audience: id,
        title: "Welcome to CryptoWise",
        body: "Your account has been created. Your account manager will help you fund your account — reach out any time.",
        kind: "account",
      });
      const session = createSession("client", email, id);
      return NextResponse.json({ ok: true, token: session.token, role: "client", client: publicClient(data.clients.find((c) => c.id === id)!) });
    });
  }

  if (body.action === "logout") {
    const token = bearer(req);
    if (token) destroySession(token);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
