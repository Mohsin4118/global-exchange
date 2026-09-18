/* ------------------------------------------------------------------ */
/*  CryptoWise — browser API client                                    */
/*  Thin fetch wrapper over /api/auth, /api/client and /api/admin.     */
/*  Bearer tokens live in localStorage; the server decides what each   */
/*  token may see, so the UI can never render data it didn't receive   */
/*  from an authorized endpoint.                                       */
/* ------------------------------------------------------------------ */

import type { AdminSnapshot, ClientAction, ClientView, PublicClient } from "@/lib/shared-types";

const CLIENT_TOKEN_KEY = "cw_client_token";
const ADMIN_TOKEN_KEY = "cw_admin_token";

export function getClientToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CLIENT_TOKEN_KEY);
}

export function setClientToken(token: string) {
  window.localStorage.setItem(CLIENT_TOKEN_KEY, token);
}

export function clearClientToken() {
  window.localStorage.removeItem(CLIENT_TOKEN_KEY);
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string) {
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function post<T>(url: string, body: unknown, token?: string | null): Promise<T & { ok: boolean; error?: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({ ok: false, error: "network" }))) as T & { ok: boolean; error?: string };
  return json;
}

/* ---------------- auth ---------------- */

export interface LoginResult {
  ok: boolean;
  error?: string;
  token?: string;
  role?: "client" | "admin";
  client?: PublicClient;
  /** client-register: true when the submission became a PENDING account
      request (Super Admin review) instead of an active session. */
  pending?: boolean;
}

export async function apiClientLogin(email: string, password: string): Promise<LoginResult> {
  const res = await post<LoginResult>("/api/auth", { action: "client-login", email, password });
  if (res.ok && res.token) setClientToken(res.token);
  return res;
}

export async function apiAdminLogin(email: string, password: string): Promise<LoginResult> {
  const res = await post<LoginResult>("/api/auth", { action: "admin-login", email, password });
  if (res.ok && res.token) setAdminToken(res.token);
  return res;
}

export async function apiRegister(
  name: string,
  email: string,
  password: string,
  phone?: string,
  country?: string,
  address?: string,
): Promise<LoginResult> {
  // Registration creates a PENDING account request — the server never
  // issues a client token here, so nothing is stored locally.
  return post<LoginResult>("/api/auth", { action: "client-register", name, email, password, phone, country, address });
}

export async function apiLogout(kind: "client" | "admin") {
  const token = kind === "client" ? getClientToken() : getAdminToken();
  if (token) await post("/api/auth", { action: "logout" }, token);
  if (kind === "client") clearClientToken();
  else clearAdminToken();
}

/** Session restore: who does this browser's token belong to? */
export async function apiWhoami(kind: "client" | "admin"): Promise<{ authenticated: boolean; client?: PublicClient }> {
  const token = kind === "client" ? getClientToken() : getAdminToken();
  if (!token) return { authenticated: false };
  try {
    const res = await fetch("/api/auth", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    return (await res.json()) as { authenticated: boolean; client?: PublicClient };
  } catch {
    return { authenticated: false };
  }
}

/* ---------------- client portal ---------------- */

export type ClientViewResponse = { ok: boolean; error?: string } & Partial<ClientView>;

export async function apiClientGet(): Promise<ClientViewResponse> {
  const token = getClientToken();
  if (!token) return { ok: false, error: "unauthorized" };
  try {
    const res = await fetch("/api/client", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (res.status === 401) clearClientToken();
    return (await res.json()) as ClientViewResponse;
  } catch {
    return { ok: false, error: "network" };
  }
}

export async function apiClientAction(action: ClientAction): Promise<ClientViewResponse> {
  const token = getClientToken();
  if (!token) return { ok: false, error: "unauthorized" };
  try {
    const res = await fetch("/api/client", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(action),
      cache: "no-store",
    });
    return (await res.json()) as ClientViewResponse;
  } catch {
    return { ok: false, error: "network" };
  }
}

/* ---------------- admin ---------------- */

export type AdminSnapshotResponse = { ok: boolean; error?: string; snapshot?: AdminSnapshot };

export async function apiAdminGet(): Promise<AdminSnapshotResponse> {
  const token = getAdminToken();
  if (!token) return { ok: false, error: "unauthorized" };
  try {
    const res = await fetch("/api/admin", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (res.status === 401) clearAdminToken();
    return (await res.json()) as AdminSnapshotResponse;
  } catch {
    return { ok: false, error: "network" };
  }
}

export async function apiAdminAction(action: import("@/lib/shared-types").AdminAction): Promise<AdminSnapshotResponse & { error?: string }> {
  const token = getAdminToken();
  if (!token) return { ok: false, error: "unauthorized" };
  try {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(action),
      cache: "no-store",
    });
    return (await res.json()) as AdminSnapshotResponse & { error?: string };
  } catch {
    return { ok: false, error: "network" };
  }
}
