/* ------------------------------------------------------------------ */
/*  CryptoWise — server-side database (single source of truth)         */
/*  JSON file store under /data. ALL mutations go through the API      */
/*  routes, which enforce authentication and authorization: a client   */
/*  token can only ever touch its own records; admin endpoints require */
/*  an admin session. Balances are never stored — they are always      */
/*  computed from the transaction ledger, so every edit/delete is      */
/*  reflected everywhere at once.                                      */
/* ------------------------------------------------------------------ */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { DEFAULT_FX } from "@/lib/shared-types";
import type {
  AccountRequest,
  AdminRole,
  AdminSnapshot,
  AdminStats,
  AuditAction,
  AuditEntry,
  Client,
  ClientComment,
  ComputedFinancials,
  DbData,
  Notification,
  PublicClient,
  Session,
  StaffMember,
  Tx,
  TxEvent,
  TxStatus,
} from "@/lib/shared-types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

/* ---------------- password hashing (scrypt) ---------------- */

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password: string, stored: { salt: string; hash: string }): boolean {
  try {
    const candidate = crypto.scryptSync(password, stored.salt, 64);
    const expected = Buffer.from(stored.hash, "hex");
    return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

/* ---------------- ids & formatting ---------------- */

let seq = 0;
export function uid(prefix: string): string {
  seq += 1;
  return `${prefix}${Date.now().toString(36)}${seq.toString(36)}${crypto.randomBytes(3).toString("hex")}`;
}

export function newReference(): string {
  const d = new Date();
  const ymd = `${d.getFullYear().toString().slice(-2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `TXN-${ymd}-${crypto.randomInt(1000, 9999)}`;
}

export function stamp(): string {
  const d = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}, ${String(h).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} ${ampm}`;
}

function relTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "just now";
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.round(days / 7)}w ago`;
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/* ---------------- seed ---------------- */

function makeTx(p: {
  clientId: string;
  dateISO: string;
  kind: Tx["kind"];
  type: Tx["type"];
  amount: number;
  label: string;
  labelKey?: string;
  asset?: string;
  status?: Tx["status"];
  method?: string;
  notes?: string;
}): Tx {
  const status = p.status ?? "COMPLETED";
  return {
    id: uid("tx"),
    clientId: p.clientId,
    dateISO: p.dateISO,
    kind: p.kind,
    type: p.type,
    amount: p.amount,
    label: p.label,
    labelKey: p.labelKey,
    asset: p.asset,
    status,
    reference: newReference(),
    method: p.method ?? "Bank Transfer",
    notes: p.notes ?? "—",
    history: [{ at: new Date(`${p.dateISO}T10:00:00Z`).toISOString(), by: "CryptoWise", byRole: "system", from: null, to: status }],
    createdAtISO: new Date(`${p.dateISO}T10:00:00Z`).toISOString(),
    updatedAtISO: new Date(`${p.dateISO}T10:00:00Z`).toISOString(),
  };
}

function makeNotification(p: Pick<Notification, "audience" | "title" | "body" | "kind"> & { createdAtISO?: string; unread?: boolean; requestId?: string }): Notification {
  const createdAtISO = p.createdAtISO ?? new Date().toISOString();
  return {
    id: uid("n"),
    audience: p.audience,
    title: p.title,
    body: p.body,
    kind: p.kind,
    ...(p.requestId ? { requestId: p.requestId } : {}),
    createdAtISO,
    time: relTime(createdAtISO),
    unread: p.unread ?? true,
  };
}

function seed(): DbData {
  const legacy: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    country: string;
    balance: number;
    agent: string;
    joined: number;
    credits: Array<[number, string]>;
    debits?: Array<[number, string]>;
  }> = [
    { id: "cmu17qlbz001kksrjcmizek47", name: "جميل باعاد", email: "Jamalabaabad@cryptowiseuk.com", phone: "966655444511", country: "Saudi Arabia", balance: 630093.15, agent: "Super Admin", joined: 1, credits: [[630093.15, "Deposit — Bank Transfer"]] },
    { id: "cmu12en3o0017ksrj5f2ew7sm", name: "Mohammad zakaria Almairi", email: "mzalmyri@gmail.com", phone: "967712345678", country: "", balance: 1647314.64, agent: "Super Admin", joined: 1, credits: [[1647314.64, "Deposit — Bank Transfer"]] },
    { id: "cmu0wcfw2000jksrj6zsjppcz", name: "Abdalkafi M", email: "abdalkafi11@cryptowiseuk.com", phone: "249912345678", country: "Saudi Arabia", balance: 230697.3, agent: "Super Admin", joined: 2, credits: [[230697.3, "Deposit — Bank Transfer"]] },
    { id: "cmu0xcb3x000hksrjxd9gt4nq", name: "Charlie Williams (Joint A/C - No: 35d2c6sd52)", email: "charliew12@gmail.com", phone: "447700900123", country: "United Kingdom", balance: 652103.61, agent: "Super Admin", joined: 2, credits: [[380000, "Deposit — Bank Transfer"], [122000, "Deposit — Bank Transfer"], [150103.61, "Deposit — Bank Transfer"]] },
    { id: "cmu0yd9z000gksrjq2pf8wxk", name: "John John", email: "john1@gmail.com", phone: "", country: "", balance: 0, agent: "Super Admin", joined: 3, credits: [] },
    { id: "cmu0zr4w000fksrju8hn3v2m", name: "سيد محمد محمود", email: "h6939411@gmail.com", phone: "", country: "السعودية", balance: 0, agent: "", joined: 4, credits: [] },
    { id: "cmtyzus0r000aksrjgsnsegbh", name: "محسن ذيب الفقاطيني", email: "Mohsen@cryptowiseuk.com", phone: "962790000000", country: "", balance: 2856800.62, agent: "", joined: 4, credits: [[2856800.62, "Deposit — Bank Transfer"]] },
    { id: "cmtvd6b3z000jksrjy0ql8d2", name: "عزيز الزهراني", email: "alzhrany@cryptowiseuk.com", phone: "966501234567", country: "", balance: 179679.35, agent: "", joined: 4, credits: [[179679.35, "Deposit — Bank Transfer"]] },
    { id: "cmtvdbf10000iksrj4xw2n7q", name: "محمد النبريصي", email: "mhmdalnbryst214@gmail.com", phone: "", country: "", balance: 62088.96, agent: "", joined: 4, credits: [[62088.96, "Deposit — Bank Transfer"]] },
    { id: "cmtve5k80000hksrjq3xn9w2", name: "Salem Hadi", email: "Salem12@cryptowiseuk.com", phone: "967734567890", country: "", balance: 120009.96, agent: "", joined: 5, credits: [[120009.96, "Deposit — Bank Transfer"]] },
    { id: "cmtv9p2w00007ksrjum3dx4k", name: "Paula Louise Mole", email: "paula.mole@outlook.com", phone: "447700900456", country: "United Kingdom", balance: 18810.58, agent: "", joined: 5, credits: [[20000, "Deposit — Bank Transfer"], [1000, "Deposit — Bank Transfer"]], debits: [[2189.42, "Debit — Bank charges"]] },
    { id: "cmtvczfiy0006ksrjb5rs8e2d", name: "Najah Nubraisii", email: "najah.n@gmail.com", phone: "", country: "", balance: 60000, agent: "", joined: 6, credits: [[60000, "Deposit — Bank Transfer"]] },
    { id: "cmtvda7w00004ksrjk9lm3f8q", name: "ALY ABDELMOULA", email: "aly.abdelmoula@gmail.com", phone: "21620123456", country: "", balance: 120525, agent: "", joined: 6, credits: [[120525, "Deposit — Bank Transfer"]] },
    { id: "cmtvd4a1z0005ksrjm2xt7v3n", name: "عزيز جمال الزهراني", email: "aziz.jalal@gmail.com", phone: "", country: "", balance: 1.0, agent: "", joined: 6, credits: [[1.0, "Test deposit"]] },
    { id: "cmtt8k3w00002ksrjp6vh9x4d", name: "marc John", email: "marc.john@gmail.com", phone: "", country: "", balance: 65983.91, agent: "", joined: 8, credits: [[65983.91, "Deposit — Bank Transfer"]] },
    { id: "cmtt5r9w00001ksrjw4yq2f6n", name: "John Anderson", email: "john.anderson@proton.me", phone: "", country: "", balance: 65983.92, agent: "", joined: 8, credits: [[65983.92, "Deposit — Bank Transfer"]] },
  ];

  const clients: Client[] = [];
  const txs: Tx[] = [];
  const notifications: Notification[] = [];
  const legacyPassword = hashPassword("Client@2026");

  for (const l of legacy) {
    clients.push({
      id: l.id,
      accountNo: `CW-${100000 + (Math.abs(hashCode(l.id)) % 899999)}`,
      name: l.name,
      email: l.email,
      passwordHash: { ...legacyPassword },
      phone: l.phone,
      country: l.country,
      address: "",
      city: "",
      postcode: "",
      openingBalance: 0,
      holdings: [],
      tier: l.balance >= 500000 ? "Private" : l.balance >= 100000 ? "Premium" : "Standard",
      status: "active",
      kycStatus: l.credits.length > 0 ? "verified" : "unverified",
      agent: l.agent,
      managerNote: "",
      sourceOfFunds: "",
      currency: "USD",
      createdAtISO: daysAgoISO(l.joined),
    });
    for (const [amount, label] of l.credits) {
      txs.push(makeTx({ clientId: l.id, dateISO: daysAgoISO(l.joined), kind: "deposit", type: "CREDIT", amount, label }));
    }
    for (const [amount, label] of l.debits ?? []) {
      txs.push(makeTx({ clientId: l.id, dateISO: daysAgoISO(l.joined), kind: "adjustment", type: "DEBIT", amount, label }));
    }
    notifications.push(
      makeNotification({
        audience: "admin",
        title: "New Client Registration",
        body: `${l.name} has registered on the platform.`,
        kind: "registration",
        createdAtISO: new Date(`${daysAgoISO(l.joined)}T09:30:00Z`).toISOString(),
        unread: false,
      }),
    );
  }

  /* ---- pending withdrawal requests (from the platform's withdrawal queue) ---- */
  const withdrawals: Array<{ client: string; date: number; amount: string; usd: number; method: string; address: string }> = [
    { client: "cmtv9p2w00007ksrjum3dx4k", date: 5, amount: "20000.00000000 USDT", usd: 20000, method: "Crypto — USDT (TRC-20)", address: "TQn9Y2khEsLJW1ChVWFMSMeRDow5oNj4yE" },
    { client: "cmtve5k80000hksrjq3xn9w2", date: 6, amount: "10000.00000000 USDT", usd: 10000, method: "Crypto — USDT (ERC-20)", address: "0x8fA7b4C23E9105D6ea7B3190cD425f6E8a90D123" },
    { client: "cmu0yd9z000gksrjq2pf8wxk", date: 7, amount: "0.12636634 BTC", usd: 9775.42, method: "Crypto — Bitcoin", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" },
  ];
  for (const w of withdrawals) {
    txs.push(
      makeTx({
        clientId: w.client,
        dateISO: daysAgoISO(w.date),
        kind: "withdrawal",
        type: "DEBIT",
        amount: w.usd,
        label: `Withdrawal request — ${w.amount}`,
        status: "PENDING",
        method: w.method,
        notes: w.address,
      }),
    );
    const client = legacy.find((l) => l.id === w.client);
    notifications.push(
      makeNotification({
        audience: "admin",
        title: "New Withdrawal Request",
        body: `${client?.name ?? "Client"} requested a withdrawal of ${w.amount}.`,
        kind: "withdrawal",
        createdAtISO: new Date(`${daysAgoISO(w.date)}T14:00:00Z`).toISOString(),
      }),
    );
  }

  /* ---- demo client (Alex Morgan) — the published demo credentials ---- */
  const demoId = "demo-client";
  clients.push({
    id: demoId,
    accountNo: "CW-102394",
    name: "Alex Morgan",
    email: "demo@cryptowiseuk.com",
    passwordHash: hashPassword("Demo@2026"),
    phone: "+44 7700 900123",
    country: "United Kingdom",
    address: "44 Harbor Point",
    city: "Bristol",
    postcode: "BS1 4TT",
    openingBalance: 0,
    holdings: [
      { assetId: "bitcoin", units: 0.35 },
      { assetId: "ethereum", units: 4.2 },
      { assetId: "tether", units: 12500 },
      { assetId: "solana", units: 18 },
      { assetId: "aramco", units: 1200 },
      { assetId: "salik", units: 2500 },
    ],
    tier: "Private",
    status: "active",
    kycStatus: "verified",
    agent: "Super Admin",
    managerNote: "Your dedicated portfolio manager is available Mon–Fri, 9am–6pm GMT.",
    sourceOfFunds: "Salary, savings and long-term investments.",
    currency: "USD",
    createdAtISO: daysAgoISO(26),
    isDemo: true,
  });
  const demoTrades: Array<[number, number, string]> = [
    [18, 27088.95, "0.35 BTC"],
    [17, 10448.05, "4.2 ETH"],
    [16, 1818.36, "18 SOL"],
    [14, 8736, "1,200 Aramco"],
    [14, 3500, "2,500 Salek"],
    [13, 12497.5, "12,500 USDT"],
  ];
  txs.push(makeTx({ clientId: demoId, dateISO: daysAgoISO(21), kind: "deposit", type: "CREDIT", amount: 85000, label: "Wire deposit — First Gulf Bank", labelKey: "txWireIn" }));
  for (const [day, amount, asset] of demoTrades) {
    txs.push(makeTx({ clientId: demoId, dateISO: daysAgoISO(day), kind: "trade", type: "DEBIT", amount, label: "Buy order filled", labelKey: "txBuy", asset }));
  }
  txs.push(makeTx({ clientId: demoId, dateISO: daysAgoISO(11), kind: "withdrawal", type: "DEBIT", amount: 8431.14, label: "Withdrawal to bank account", labelKey: "txWithdraw" }));
  txs.push(
    makeTx({
      clientId: demoId,
      dateISO: daysAgoISO(1),
      kind: "withdrawal",
      type: "DEBIT",
      amount: 2000,
      label: "Withdrawal request — bank transfer",
      status: "PENDING",
      notes: "Requested from client dashboard",
    }),
  );
  notifications.push(
    makeNotification({
      audience: demoId,
      title: "Welcome to CryptoWise",
      body: "Your private portal is live. Your dedicated manager can be reached any time from the contact buttons below.",
      kind: "account",
      createdAtISO: new Date(`${daysAgoISO(26)}T09:00:00Z`).toISOString(),
      unread: false,
    }),
    makeNotification({
      audience: demoId,
      title: "Wire deposit received",
      body: "Your deposit of $85,000.00 has been credited to your account.",
      kind: "deposit",
      createdAtISO: new Date(`${daysAgoISO(21)}T11:00:00Z`).toISOString(),
      unread: false,
    }),
    makeNotification({
      audience: demoId,
      title: "Withdrawal request received",
      body: "Your withdrawal request of $2,000.00 is being reviewed by your account manager.",
      kind: "withdrawal",
      createdAtISO: new Date(`${daysAgoISO(1)}T12:30:00Z`).toISOString(),
      unread: true,
    }),
  );

  /* ---- second portal client — proves client A can never see client B ---- */
  const sarahId = "client-sarah";
  clients.push({
    id: sarahId,
    accountNo: "CW-238171",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    passwordHash: hashPassword("Sarah@2026"),
    phone: "+44 7700 900456",
    country: "United Kingdom",
    address: "12 Kingsway Mews",
    city: "London",
    postcode: "W1T 4QJ",
    openingBalance: 0,
    holdings: [],
    tier: "Premium",
    status: "active",
    kycStatus: "pending",
    agent: "Super Admin",
    managerNote: "",
    sourceOfFunds: "",
    currency: "USD",
    createdAtISO: daysAgoISO(2),
  });
  txs.push(makeTx({ clientId: sarahId, dateISO: daysAgoISO(2), kind: "opening", type: "CREDIT", amount: 25000, label: "Account opening deposit", labelKey: "txOpening" }));
  notifications.push(
    makeNotification({ audience: "admin", title: "New Client Registration", body: "Sarah Johnson has registered on the platform.", kind: "registration", createdAtISO: new Date(`${daysAgoISO(2)}T10:15:00Z`).toISOString() }),
    makeNotification({
      audience: sarahId,
      title: "Welcome to CryptoWise",
      body: "Your account has been created. Your account manager will help you fund your account — reach out any time.",
      kind: "account",
      createdAtISO: new Date(`${daysAgoISO(2)}T10:16:00Z`).toISOString(),
      unread: false,
    }),
  );

  /* ---- audit history (replicated from the platform) ---- */
  const audit: AuditEntry[] = [
    { id: "a57", date: "Sep 14, 2026, 01:39 PM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmtyzus0r000aksrjgsnsegbh","type":"CREDIT","amount":2856332,"reference":"TXN-2026-0908-01"}', ip: "—" },
    { id: "a56", date: "Sep 14, 2026, 01:22 PM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmu17qlbz001kksrjcmizek47","type":"CREDIT","amount":630015,"reference":"TXN-2026-0914-05"}', ip: "—" },
    { id: "a55", date: "Sep 14, 2026, 01:22 PM", admin: "Super Admin", action: "Create Client", entity: "USER", detailsNew: '{"email":"Jamalabaabad@cryptowiseuk.com","name":"جميل باعاد","country":"Saudi Arabia"}', ip: "—" },
    { id: "a54", date: "Sep 14, 2026, 11:06 AM", admin: "Super Admin", action: "Update Client", entity: "USER", detailsOld: '{"name":null,"email":"Abdalkafi11@cryptowiseuk.com"}', detailsNew: '{"name":"Abdalkafi M","email":"abdalkafi11@cryptowiseuk.com"}', ip: "—" },
    { id: "a53", date: "Sep 14, 2026, 11:03 AM", admin: "Super Admin", action: "Create Transaction", entity: "TRANSACTION", detailsNew: '{"clientId":"cmu12en3o0017ksrj5f2ew7sm","type":"CREDIT","amount":1662000,"reference":"TXN-2026-0914-04"}', ip: "—" },
    { id: "a49", date: "Sep 14, 2026, 08:03 AM", admin: "Super Admin", action: "Create Client", entity: "USER", detailsNew: '{"email":"Abdalkafi11@cryptowiseuk.com","name":"Abdalkafi M","country":"Saudi Arabia"}', ip: "—" },
    { id: "a48", date: "Sep 13, 2026, 04:29 PM", admin: "Super Admin", action: "Update Client", entity: "USER", detailsOld: '{"name":"Charile Williams","email":"charliew12@gmail.com"}', detailsNew: '{"name":"Charlie Williams (Joint A/C - No: 35d2c6sd52)","email":"charliew12@gmail.com"}', ip: "—" },
    { id: "a45", date: "Sep 12, 2026, 09:38 AM", admin: "Super Admin", action: "Create Client", entity: "USER", detailsNew: '{"email":"paula.mole@outlook.com","name":"Paula Louise Mole","country":"United Kingdom"}', ip: "—" },
    { id: "a27", date: "Sep 7, 2026, 04:02 PM", admin: "Super Admin", action: "Create Client", entity: "USER", detailsNew: '{"email":"najah.n@gmail.com","name":"Najah Nubraisii"}', ip: "—" },
    { id: "a21", date: "Sep 4, 2026, 07:41 AM", admin: "Super Admin", action: "Sign In", entity: "SESSION", detailsNew: '{"method":"password","mfa":true}', ip: "—" },
    { id: "a18", date: "Sep 3, 2026, 05:26 PM", admin: "Super Admin", action: "Create Client", entity: "USER", detailsNew: '{"email":"john.anderson@proton.me","name":"John Anderson"}', ip: "—" },
    { id: "a02", date: "Aug 22, 2026, 05:35 PM", admin: "Super Admin", action: "Create Role", entity: "ROLE", detailsNew: '{"name":"Super Admin","permissions":["all"]}', ip: "—" },
  ];

  const staff: StaffMember[] = [
    { id: "st1", name: "Super Admin", email: "super@cryptowiseuk.com", role: "Super Admin", status: "ACTIVE", lastLogin: "—", you: true },
    { id: "st2", name: "Super Admin", email: "bouabidbeegrowth@gmail.com", role: "Super Admin", status: "ACTIVE", lastLogin: "Sep 14, 2026" },
  ];

  const roles: AdminRole[] = [
    { id: "r1", name: "Super Admin", allAccess: true, permissions: [], staffCount: 2 },
    { id: "r2", name: "Agent", permissions: ["View", "Create", "Edit", "Delete", "Manage", "Send"], staffCount: 0 },
  ];

  return {
    clients,
    accountRequests: [],
    txs,
    notifications,
    audit,
    comments: [],
    staff,
    roles,
    sessions: [],
    adminUser: {
      email: "super@cryptowiseuk.com",
      name: "Super Admin",
      passwordHash: hashPassword("Super@2026"),
    },
    fx: { ...DEFAULT_FX },
  };
}

/* ---------------- file IO ---------------- */

function readDb(): DbData {
  if (!fs.existsSync(DB_FILE)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const seeded = seed();
    fs.writeFileSync(DB_FILE, JSON.stringify(seeded, null, 2), "utf8");
    return seeded;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as DbData;
    if (!parsed.adminUser || !Array.isArray(parsed.clients)) throw new Error("corrupt db");
    parsed.sessions ??= [];
    parsed.accountRequests ??= [];
    parsed.comments ??= [];
    parsed.staff ??= [];
    parsed.roles ??= [];
    parsed.audit ??= [];
    parsed.notifications ??= [];
    parsed.txs ??= [];
    // display-currency backfill (older db files keep working)
    parsed.fx = { ...DEFAULT_FX, ...(parsed.fx ?? {}) };
    for (const c of parsed.clients) {
      c.currency ??= "USD";
      c.sourceOfFunds ??= "";
    }
    for (const r of parsed.accountRequests) {
      r.status ??= "pending";
      r.phone ??= "";
      r.country ??= "";
      r.address ??= "";
    }
    return parsed;
  } catch {
    const seeded = seed();
    fs.writeFileSync(DB_FILE, JSON.stringify(seeded, null, 2), "utf8");
    return seeded;
  }
}

function writeDb(data: DbData) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, DB_FILE);
}

/** Read (seeding on first use). */
export function db(): DbData {
  return readDb();
}

/** Mutate the database atomically and persist. */
export function mutate<T>(fn: (data: DbData) => T): T {
  const data = readDb();
  const result = fn(data);
  writeDb(data);
  return result;
}

/* ---------------- sessions & authz ---------------- */

export function createSession(role: "admin" | "client", email: string, clientId?: string): Session {
  const session: Session = {
    token: crypto.randomBytes(24).toString("hex"),
    role,
    email,
    clientId,
    createdAtISO: new Date().toISOString(),
  };
  mutate((data) => {
    data.sessions = [session, ...data.sessions].slice(0, 200);
  });
  return session;
}

export function resolveSession(token: string | null | undefined): Session | null {
  if (!token) return null;
  const data = readDb();
  return data.sessions.find((s) => s.token === token) ?? null;
}

export function destroySession(token: string) {
  mutate((data) => {
    data.sessions = data.sessions.filter((s) => s.token !== token);
  });
}

export function removeSessionsFromData(data: DbData, target: { clientId?: string; adminEmail?: string }, exceptToken?: string | null) {
  const adminEmail = target.adminEmail?.trim().toLowerCase();
  data.sessions = data.sessions.filter((s) => {
    if (exceptToken && s.token === exceptToken) return true;
    if (target.clientId && s.role === "client" && s.clientId === target.clientId) return false;
    if (adminEmail && s.role === "admin" && s.email.toLowerCase() === adminEmail) return false;
    return true;
  });
}

/** Session must belong to a client — returns the client record or null. */
export function requireClient(token: string | null | undefined): Client | null {
  const session = resolveSession(token);
  if (!session || session.role !== "client" || !session.clientId) return null;
  return readDb().clients.find((c) => c.id === session.clientId) ?? null;
}

/** Session must be an admin session. */
export function requireAdmin(token: string | null | undefined): boolean {
  const session = resolveSession(token);
  return Boolean(session && session.role === "admin");
}

/* ---------------- derived money math ---------------- */

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Request statuses that are still moving through the pipeline. Everything
    except REJECTED / CANCELLED / COMPLETED reserves funds (withdrawals) and
    counts as an open request. */
export function inFlight(status: TxStatus): boolean {
  return status === "PENDING" || status === "UNDER_REVIEW" || status === "APPROVED" || status === "PROCESSING";
}

export function computeFinancials(clientId: string, data: DbData): ComputedFinancials {
  const client = data.clients.find((c) => c.id === clientId);
  const own = data.txs.filter((t) => t.clientId === clientId);
  let credits = 0;
  let debits = 0;
  let pendingWithdrawals = 0;
  for (const t of own) {
    if (t.status === "COMPLETED") {
      if (t.type === "CREDIT") credits += t.amount;
      else debits += t.amount;
    } else if (inFlight(t.status) && t.kind === "withdrawal" && t.type === "DEBIT") {
      pendingWithdrawals += t.amount;
    }
  }
  const balance = Math.max(0, (client?.openingBalance ?? 0) + credits - debits);
  return {
    balance: round2(balance),
    available: round2(Math.max(0, balance - pendingWithdrawals)),
    credits: round2(credits),
    debits: round2(debits),
    pendingWithdrawals: round2(pendingWithdrawals),
    txCount: own.length,
  };
}

/** Balance timeline per client so each tx row can show "balance after". */
function balanceAfterMap(data: DbData): Map<string, number> {
  const result = new Map<string, number>();
  const byClient = new Map<string, Tx[]>();
  for (const t of data.txs) {
    const list = byClient.get(t.clientId) ?? [];
    list.push(t);
    byClient.set(t.clientId, list);
  }
  for (const [clientId, list] of byClient) {
    const client = data.clients.find((c) => c.id === clientId);
    const sorted = [...list].sort((a, b) => (a.dateISO === b.dateISO ? a.createdAtISO.localeCompare(b.createdAtISO) : a.dateISO.localeCompare(b.dateISO)));
    let bal = client?.openingBalance ?? 0;
    for (const t of sorted) {
      if (t.status === "COMPLETED") bal = Math.max(0, bal + (t.type === "CREDIT" ? t.amount : -t.amount));
      result.set(t.id, round2(bal));
    }
  }
  return result;
}

/* ---------------- safe serialization ---------------- */

export function publicClient(c: Client): PublicClient {
  const { passwordHash: _drop, ...rest } = c;
  return rest;
}

export function adminSnapshot(): AdminSnapshot {
  const data = readDb();
  const balAfter = balanceAfterMap(data);
  const clients = data.clients.map((c) => ({
    ...publicClient(c),
    financials: computeFinancials(c.id, data),
    hasPortalPassword: true,
  }));
  const accountRequests = [...data.accountRequests]
    .sort((a, b) => b.createdAtISO.localeCompare(a.createdAtISO))
    .map(({ passwordHash: _drop, ...rest }) => rest);
  const nameById = new Map(data.clients.map((c) => [c.id, c.name] as const));
  const txs = [...data.txs]
    .sort((a, b) => (a.dateISO === b.dateISO ? b.createdAtISO.localeCompare(a.createdAtISO) : b.dateISO.localeCompare(a.dateISO)))
    .map((t) => ({ ...t, clientName: nameById.get(t.clientId) ?? "—", balanceAfter: balAfter.get(t.id) ?? 0 }));

  const completed = txs.filter((t) => t.status === "COMPLETED");
  const requestCounts = txs.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1;
      return acc;
    },
    { COMPLETED: 0, PENDING: 0, UNDER_REVIEW: 0, APPROVED: 0, PROCESSING: 0, REJECTED: 0, CANCELLED: 0 } as Record<TxStatus, number>,
  );
  const stats: AdminStats = {
    totalClients: clients.length,
    activeClients: clients.filter((c) => c.status === "active").length,
    totalBalance: round2(clients.reduce((s, c) => s + c.financials.balance, 0)),
    volume: round2(completed.reduce((s, t) => s + t.amount, 0)),
    credits: round2(completed.filter((t) => t.type === "CREDIT").reduce((s, t) => s + t.amount, 0)),
    debits: round2(completed.filter((t) => t.type === "DEBIT").reduce((s, t) => s + t.amount, 0)),
    pendingWithdrawals: txs.filter((t) => t.kind === "withdrawal" && inFlight(t.status)).length,
    pendingAccountRequests: data.accountRequests.filter((r) => r.status === "pending").length,
    txCount: txs.length,
    requestCounts,
  };

  const comments: Record<string, ClientComment[]> = {};
  for (const cm of data.comments) {
    (comments[cm.clientId] ??= []).push(cm);
  }

  return {
    clients,
    accountRequests,
    txs,
    notifications: [...data.notifications].sort((a, b) => b.createdAtISO.localeCompare(a.createdAtISO)),
    audit: data.audit,
    comments,
    staff: data.staff,
    roles: data.roles,
    stats,
    fx: data.fx,
  };
}

/** The one and only payload a client may ever receive about itself. */
export function clientView(clientId: string): { ok: true; view: { client: PublicClient; financials: ComputedFinancials; txs: Tx[]; notifications: Notification[]; fx: Record<string, number> } } | { ok: false } {
  const data = readDb();
  const client = data.clients.find((c) => c.id === clientId);
  if (!client) return { ok: false };
  return {
    ok: true,
    view: {
      client: publicClient(client),
      financials: computeFinancials(clientId, data),
      txs: data.txs
        .filter((t) => t.clientId === clientId)
        .sort((a, b) => (a.dateISO === b.dateISO ? b.createdAtISO.localeCompare(a.createdAtISO) : b.dateISO.localeCompare(a.dateISO)))
        .map(clientSafeTx),
      notifications: data.notifications.filter((n) => n.audience === clientId).sort((a, b) => b.createdAtISO.localeCompare(a.createdAtISO)),
      fx: data.fx,
    },
  };
}

function clientFacingLabel(label: string): string {
  return label
    .replace(/\s*[—-]\s*posted by Super Admin/gi, "")
    .replace(/\bSuper Admin\b/gi, "Account Manager")
    .trim();
}

/** Client-safe transaction: strips the PRIVATE admin note and every internal
    remark from the history (the status transition itself stays visible; only
    the internal wording is removed). Admin actors are anonymised to a generic
    account-manager label so admin role names never leak through the client API. */
export function clientSafeTx(t: Tx): Tx {
  const { adminNote: _private, ...rest } = t;
  const history = (t.history ?? []).map<TxEvent>((e) => ({
    at: e.at,
    by: e.byRole === "admin" ? "Account Manager" : e.by,
    byRole: e.byRole,
    from: e.from,
    to: e.to,
    ...(e.note ? { note: clientFacingLabel(e.note) } : {}),
    ...(e.changes ? { changes: e.changes } : {}),
  }));
  return { ...rest, label: clientFacingLabel(rest.label), history };
}

/* ---------------- audit & notification helpers ---------------- */

export function pushAudit(data: DbData, action: AuditAction, entity: AuditEntry["entity"], detailsNew: string, detailsOld?: string) {
  data.audit = [{ id: uid("a"), date: stamp(), admin: "Super Admin", action, entity, detailsNew, detailsOld, ip: "—" }, ...data.audit].slice(0, 300);
}

export function pushNotification(data: DbData, p: Pick<Notification, "audience" | "title" | "body" | "kind"> & { requestId?: string }) {
  data.notifications = [makeNotification(p), ...data.notifications].slice(0, 400);
}
