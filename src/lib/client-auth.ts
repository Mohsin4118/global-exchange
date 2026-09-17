/* ------------------------------------------------------------------ */
/*  CryptoWise — Client portal accounts (demo + Super Admin created)   */
/*  Client-side mock store persisted in localStorage. The Super Admin  */
/*  creates portal accounts from the CRM "New Client" form; those      */
/*  accounts immediately sign in on the public site and land on their  */
/*  own dashboard. CRM credit/debit transactions sync into the client  */
/*  cash balance in real time.                                         */
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
  isDemo?: boolean;
}

export const DEMO_EMAIL = "demo@cryptowiseuk.com";
export const DEMO_PASSWORD = "Demo@2026";

const ACCOUNTS_KEY = "cw_portal_accounts";
const SESSION_KEY = "cw_portal_session";

/* ---------------- Demo account ---------------- */

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
  isDemo: true,
};

/* ---------------- Store helpers ---------------- */

function readStored(): ClientAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ClientAccount[]) : [];
  } catch {
    return [];
  }
}

function writeStored(accounts: ClientAccount[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

/** All sign-in-able client accounts (demo first). */
export function getAllAccounts(): ClientAccount[] {
  return [DEMO_ACCOUNT, ...readStored()];
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
  if (email === DEMO_EMAIL.toLowerCase() || accounts.some((a) => a.email.toLowerCase() === email)) {
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
 * CRM → client sync: when the Super Admin records a credit/debit for a
 * client who owns a portal account, the cash balance and statement update.
 */
export function applyAdminTransaction(email: string, args: { delta: number; label: string }): boolean {
  const e = email.trim().toLowerCase();
  if (e === DEMO_EMAIL.toLowerCase()) return false;
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
