/* ------------------------------------------------------------------ */
/*  CryptoWise — Client portal accounts (demo + Super Admin created)   */
/*  Client-side mock store persisted in localStorage. The Super Admin  */
/*  creates portal accounts from the CRM, and controls EVERY figure    */
/*  shown on the client dashboard: cash balance, holdings (units),     */
/*  statement transactions, tier, status and the personal manager      */
/*  note. Clients can raise deposit/withdrawal requests that the       */
/*  Super Admin approves or rejects from the CRM.                      */
/* ------------------------------------------------------------------ */

import type { StringKey } from "./i18n";

export interface ClientHolding {
  assetId: string; // matches market.ts Coin.id (bitcoin, ethereum, aramco, salik…)
  units: number;
}

export interface ClientTx {
  id: string;
  dateISO: string; // e.g. "2026-09-12"
  kind: "deposit" | "withdrawal" | "trade" | "admin" | "opening";
  labelKey?: StringKey; // translated label (demo + opening credits)
  label?: string; // raw label (CRM-entered)
  asset?: string; // unit summary for trades, e.g. "0.35 BTC"
  amountUsd?: number; // cash impact magnitude (direction in `dir`)
  dir: "in" | "out";
  status: "Completed" | "Processing";
}

export type ClientTier = "Standard" | "Premium" | "Private";

export interface ClientAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  country: string;
  accountNo: string; // e.g. CW-102394
  cash: number; // available cash in USD
  holdings: ClientHolding[];
  txs: ClientTx[];
  createdAtISO: string;
  tier: ClientTier; // dashboard badge — admin controlled
  status: "active" | "suspended"; // admin controlled
  managerNote: string; // personal message rendered on the dashboard
  isDemo?: boolean;
}

export interface PortalRequest {
  id: string;
  accountId: string;
  accountNo: string;
  accountName: string;
  email: string;
  type: "deposit" | "withdrawal";
  amount: number;
  note?: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAtISO: string;
  createdAtLabel: string;
}

export const DEMO_EMAIL = "demo@cryptowiseuk.com";
export const DEMO_PASSWORD = "Demo@2026";

const ACCOUNTS_KEY = "cw_portal_accounts";
const REQUESTS_KEY = "cw_portal_requests";
const SESSION_KEY = "cw_portal_session";

/* ---------------- Demo account (seed) ---------------- */

export const DEMO_ACCOUNT: ClientAccount = {
  id: "demo-client",
  name: "Alex Morgan",
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
  phone: "+44 7700 900123",
  country: "United Kingdom",
  accountNo: "CW-102394",
  cash: 12480.0,
  holdings: [
    { assetId: "bitcoin", units: 0.35 },
    { assetId: "ethereum", units: 4.2 },
    { assetId: "tether", units: 12500 },
    { assetId: "solana", units: 18 },
    { assetId: "aramco", units: 1200 },
    { assetId: "salik", units: 2500 },
  ],
  txs: [
    { id: "dtx1", dateISO: "2026-09-05", kind: "deposit", labelKey: "txWireIn", amountUsd: 85000.0, dir: "in", status: "Completed" },
    { id: "dtx2", dateISO: "2026-09-08", kind: "trade", labelKey: "txBuy", asset: "0.35 BTC", amountUsd: 27088.95, dir: "out", status: "Completed" },
    { id: "dtx3", dateISO: "2026-09-09", kind: "trade", labelKey: "txBuy", asset: "4.2 ETH", amountUsd: 10448.05, dir: "out", status: "Completed" },
    { id: "dtx4", dateISO: "2026-09-10", kind: "trade", labelKey: "txBuy", asset: "18 SOL", amountUsd: 1818.36, dir: "out", status: "Completed" },
    { id: "dtx5", dateISO: "2026-09-12", kind: "trade", labelKey: "txBuy", asset: "1,200 Aramco", amountUsd: 8736.0, dir: "out", status: "Completed" },
    { id: "dtx6", dateISO: "2026-09-12", kind: "trade", labelKey: "txBuy", asset: "2,500 Salek", amountUsd: 3500.0, dir: "out", status: "Completed" },
    { id: "dtx7", dateISO: "2026-09-13", kind: "trade", labelKey: "txBuy", asset: "12,500 USDT", amountUsd: 12497.5, dir: "out", status: "Completed" },
    { id: "dtx8", dateISO: "2026-09-15", kind: "withdrawal", labelKey: "txWithdraw", amountUsd: 8431.14, dir: "out", status: "Completed" },
    { id: "dtx9", dateISO: "2026-09-16", kind: "withdrawal", labelKey: "txWithdraw", amountUsd: 2000.0, dir: "out", status: "Processing" },
  ],
  createdAtISO: "2026-08-21",
  tier: "Private",
  status: "active",
  managerNote: "",
  isDemo: true,
};

/* ---------------- Store helpers ---------------- */

/** Fill defaults for records saved before a given field existed. */
function normalizeAccount(a: ClientAccount): ClientAccount {
  return {
    ...a,
    cash: typeof a.cash === "number" ? a.cash : 0,
    holdings: Array.isArray(a.holdings) ? a.holdings : [],
    txs: Array.isArray(a.txs) ? a.txs : [],
    tier: a.tier ?? "Standard",
    status: a.status ?? "active",
    managerNote: a.managerNote ?? "",
  };
}

function readStored(): ClientAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) {
      // First run on this browser — seed the store with the demo account.
      window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([DEMO_ACCOUNT]));
      return [DEMO_ACCOUNT];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [DEMO_ACCOUNT];
    const accounts = (parsed as ClientAccount[]).map(normalizeAccount);
    // Migrate stores created before the demo lived inside localStorage.
    if (!accounts.some((a) => a.isDemo || a.id === DEMO_ACCOUNT.id)) {
      accounts.unshift(DEMO_ACCOUNT);
      window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    }
    return accounts;
  } catch {
    return [DEMO_ACCOUNT];
  }
}

function writeStored(accounts: ClientAccount[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

/* ---------------- Accounts API ---------------- */

/** All sign-in-able client accounts (demo included). */
export function getAllAccounts(): ClientAccount[] {
  return readStored();
}

export function getAccountById(id: string): ClientAccount | undefined {
  return readStored().find((a) => a.id === id);
}

export function findAccountByEmail(email: string): ClientAccount | undefined {
  const e = email.trim().toLowerCase();
  return getAllAccounts().find((a) => a.email.toLowerCase() === e);
}

export function authenticate(email: string, password: string): ClientAccount | null {
  const account = findAccountByEmail(email);
  if (!account || account.password !== password) return null;
  return account;
}

/** True when another account already uses this email. */
export function emailTaken(email: string, excludeId?: string): boolean {
  const e = email.trim().toLowerCase();
  return readStored().some((a) => a.id !== excludeId && a.email.toLowerCase() === e);
}

/**
 * Super Admin → New Client (CRM). Creates the portal account with an
 * opening credit transaction so the client's dashboard is ready at once.
 * Returns null when the email is already registered.
 */
export function createPortalAccount(args: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
  cash: number;
}): ClientAccount | null {
  const email = args.email.trim().toLowerCase();
  if (!email || !args.password) return null;
  const accounts = readStored();
  if (accounts.some((a) => a.email.toLowerCase() === email)) {
    return null;
  }
  const account: ClientAccount = {
    id: `c${Math.random().toString(36).slice(2, 12)}`,
    name: args.name.trim(),
    email,
    password: args.password,
    phone: args.phone?.trim() || "",
    country: args.country?.trim() || "",
    accountNo: `CW-${Math.floor(100000 + Math.random() * 900000)}`,
    cash: args.cash,
    holdings: [],
    txs:
      args.cash > 0
        ? [
            {
              id: `tx${Math.random().toString(36).slice(2, 10)}`,
              dateISO: new Date().toISOString().slice(0, 10),
              kind: "opening",
              labelKey: "txOpening",
              amountUsd: args.cash,
              dir: "in",
              status: "Completed",
            },
          ]
        : [],
    createdAtISO: new Date().toISOString().slice(0, 10),
    tier: "Standard",
    status: "active",
    managerNote: "",
  };
  writeStored([account, ...accounts]);
  return account;
}

/** Public self-registration (Get Started form) — account is usable instantly. */
export function registerSelfAccount(args: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): ClientAccount | null {
  return createPortalAccount({ ...args, cash: 0 });
}

/**
 * Super Admin — full control. Updates any field of any portal account
 * (profile, portal password, tier, status, cash, holdings, manager note).
 * The client dashboard re-reads the store every few seconds, so changes
 * appear live on the client side.
 */
export function updatePortalAccount(id: string, patch: Partial<Omit<ClientAccount, "id">>): ClientAccount | null {
  const accounts = readStored();
  const idx = accounts.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const next = normalizeAccount({ ...accounts[idx], ...patch, id: accounts[idx].id });
  accounts[idx] = next;
  writeStored(accounts);
  return next;
}

/** Super Admin — remove a portal account (demo account cannot be deleted). */
export function deletePortalAccount(id: string): boolean {
  if (id === DEMO_ACCOUNT.id) return false;
  const accounts = readStored();
  const next = accounts.filter((a) => a.id !== id);
  if (next.length === accounts.length) return false;
  writeStored(next);
  // Drop any pending requests belonging to the removed account.
  writeRequests(readRequests().filter((r) => r.accountId !== id));
  // End that client's session on this browser.
  const sessionEmail = window.localStorage.getItem(SESSION_KEY);
  const removed = accounts.find((a) => a.id === id);
  if (removed && sessionEmail && sessionEmail.toLowerCase() === removed.email.toLowerCase()) {
    window.localStorage.removeItem(SESSION_KEY);
  }
  return true;
}

/**
 * CRM → client sync: when the Super Admin records a credit/debit for a
 * client who owns a portal account, the cash balance and statement update.
 */
export function applyAdminTransaction(email: string, args: { delta: number; label: string }): boolean {
  const e = email.trim().toLowerCase();
  const accounts = readStored();
  const idx = accounts.findIndex((a) => a.email.toLowerCase() === e);
  if (idx === -1) return false;
  const account = accounts[idx];
  const next: ClientAccount = {
    ...account,
    cash: Math.max(0, account.cash + args.delta),
    txs: [
      {
        id: `tx${Math.random().toString(36).slice(2, 10)}`,
        dateISO: new Date().toISOString().slice(0, 10),
        kind: "admin",
        label: args.label,
        amountUsd: Math.abs(args.delta),
        dir: args.delta >= 0 ? "in" : "out",
        status: "Completed",
      },
      ...account.txs,
    ],
  };
  accounts[idx] = next;
  writeStored(accounts);
  return true;
}

/* ---------------- Requests (client ↔ Super Admin loop) ---------------- */

function readRequests(): PortalRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(REQUESTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as PortalRequest[]) : [];
  } catch {
    return [];
  }
}

function writeRequests(requests: PortalRequest[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

export function getRequestsForAccount(accountId: string): PortalRequest[] {
  return readRequests().filter((r) => r.accountId === accountId);
}

export function getAllPortalRequests(): PortalRequest[] {
  return readRequests();
}

/** Client dashboard → new deposit/withdrawal request for the Super Admin. */
export function addPortalRequest(args: {
  account: ClientAccount;
  type: "deposit" | "withdrawal";
  amount: number;
  note?: string;
}): PortalRequest {
  const now = new Date();
  const request: PortalRequest = {
    id: `rq${Math.random().toString(36).slice(2, 12)}`,
    accountId: args.account.id,
    accountNo: args.account.accountNo,
    accountName: args.account.name,
    email: args.account.email,
    type: args.type,
    amount: args.amount,
    note: args.note?.trim() || undefined,
    status: "Pending",
    createdAtISO: now.toISOString().slice(0, 10),
    createdAtLabel: now.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
  };
  writeRequests([request, ...readRequests()]);
  return request;
}

/**
 * Super Admin — approve/reject a client request. Approving a deposit
 * credits the cash balance; approving a withdrawal debits it (floored at
 * zero, consistent with CRM debits). Either way a statement line is added.
 */
export function setPortalRequestStatus(id: string, status: "Approved" | "Rejected"): PortalRequest | null {
  const requests = readRequests();
  const idx = requests.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const request = requests[idx];
  if (request.status !== "Pending") return requests[idx]; // already handled
  if (status === "Approved") {
    const account = getAccountById(request.accountId);
    if (account) {
      const delta = request.type === "deposit" ? request.amount : -request.amount;
      updatePortalAccount(account.id, { cash: Math.max(0, account.cash + delta) });
      const accounts = readStored();
      const aIdx = accounts.findIndex((a) => a.id === account.id);
      if (aIdx !== -1) {
        accounts[aIdx] = {
          ...accounts[aIdx],
          txs: [
            {
              id: `tx${Math.random().toString(36).slice(2, 10)}`,
              dateISO: new Date().toISOString().slice(0, 10),
              kind: request.type,
              label:
                request.type === "deposit"
                  ? `Deposit — approved by Super Admin`
                  : `Withdrawal — approved by Super Admin`,
              amountUsd: request.amount,
              dir: request.type === "deposit" ? "in" : "out",
              status: "Completed",
            },
            ...accounts[aIdx].txs,
          ],
        };
        writeStored(accounts);
      }
    }
  }
  requests[idx] = { ...request, status };
  writeRequests(requests);
  return requests[idx];
}

/* ---------------- Session (stays signed in across reloads) ---------------- */

export function setSession(account: ClientAccount) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, account.email.toLowerCase());
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function getSession(): ClientAccount | null {
  if (typeof window === "undefined") return null;
  const email = window.localStorage.getItem(SESSION_KEY);
  if (!email) return null;
  const account = findAccountByEmail(email);
  return account ?? null;
}
