/* ------------------------------------------------------------------ */
/*  CryptoWise — shared domain types (server DB + API + UI)            */
/*  ONE source of truth: every figure shown anywhere is derived from   */
/*  the transactions + clients stored in the server database.          */
/* ------------------------------------------------------------------ */

export type ClientStatus = "active" | "suspended";
export type ClientTier = "Standard" | "Premium" | "Private";
export type KycStatus = "verified" | "pending" | "unverified";

/* ---------------- display currency (client preference) ------------- */
/*  The LEDGER is always stored in USD. The display currency is a
    per-account preference: every money figure on the client dashboard
    is rendered through ONE formatter that applies the reference rate
    from the DB (admin-managed). No hardcoded frontend rates. */
export const CURRENCIES = ["USD", "SAR", "KWD", "AED", "QAR", "OMR", "GBP"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];
/** USD-based reference rates (1 USD = rate). Seeded with official pegs
    where they exist (SAR/AED/QAR/OMR) and indicative market values for
    free floaters (KWD/GBP); the Super Admin can update them at any time. */
export const DEFAULT_FX: Record<CurrencyCode, number> = {
  USD: 1,
  SAR: 3.75,
  KWD: 0.3065,
  AED: 3.6725,
  QAR: 3.64,
  OMR: 0.3845,
  GBP: 0.787,
};

export type TxKind = "deposit" | "withdrawal" | "trade" | "adjustment" | "opening";
export type TxType = "CREDIT" | "DEBIT"; // CREDIT = money in, DEBIT = money out
/** Full request lifecycle. A client can only ever CREATE a PENDING request;
    every other transition is an admin decision. PENDING / UNDER_REVIEW /
    APPROVED / PROCESSING requests reserve funds (withdrawals) but NEVER move
    the balance — only COMPLETED does. */
export type TxStatus = "COMPLETED" | "PENDING" | "UNDER_REVIEW" | "APPROVED" | "PROCESSING" | "REJECTED" | "CANCELLED";

/** One immutable entry of the per-transaction audit trail (#30).
    `internalNote` is for Super Admin eyes only and is stripped from every
    client-facing payload; `note` is the client-visible remark. */
export interface TxEvent {
  at: string; // ISO timestamp
  by: string; // display name of the actor
  byRole: "admin" | "client" | "system";
  from: TxStatus | null; // null = request creation
  to: TxStatus;
  note?: string; // client-visible remark
  internalNote?: string; // private admin note — never sent to clients
  changes?: string[]; // edited field names (for edit events)
}

export interface Tx {
  id: string;
  clientId: string;
  dateISO: string; // value date, e.g. "2026-09-14"
  kind: TxKind;
  type: TxType;
  amount: number; // always positive — direction is `type`
  label: string;
  labelKey?: string; // optional i18n key for seeded demo lines (client dashboard)
  asset?: string; // unit summary for trades, e.g. "0.35 BTC"
  destination?: string; // client-provided destination/details (wallet, bank, target)
  status: TxStatus;
  reference: string;
  method: string;
  notes: string;
  adminNote?: string; // PRIVATE admin note on the request — stripped from client payloads
  history?: TxEvent[]; // append-only status/edit trail
  createdAtISO: string;
  updatedAtISO: string;
}

export interface Holding {
  assetId: string; // matches market.ts Coin.id (bitcoin, ethereum, aramco, salik…)
  units: number;
}

export interface ClientPasswordHash {
  salt: string;
  hash: string;
}

export interface Client {
  id: string;
  accountNo: string; // client reference, e.g. "CW-102394"
  name: string;
  email: string;
  passwordHash: ClientPasswordHash;
  phone: string;
  country: string;
  address: string;
  city: string;
  postcode: string;
  openingBalance: number; // carried-in funds before the recorded transactions
  holdings: Holding[];
  tier: ClientTier;
  status: ClientStatus;
  kycStatus: KycStatus;
  agent: string; // assigned agent, "" = none
  managerNote: string; // personal message rendered on the client dashboard
  sourceOfFunds: string; // FREE TEXT curated by the Super Admin, shown on the client account
  currency: CurrencyCode; // display-currency preference for the client dashboard
  createdAtISO: string;
  lastLoginISO?: string;
  isDemo?: boolean;
}

export interface Notification {
  id: string;
  audience: "admin" | string; // "admin" or a clientId
  title: string;
  body: string;
  createdAtISO: string;
  time: string; // display label
  unread: boolean;
  kind: "registration" | "withdrawal" | "deposit" | "account" | "info";
  requestId?: string; // set when the notification is tied to an account request
}

/* ---------------- account (registration) requests ---------------- */
/*  Signing up NEVER creates an active client. Every public registration
    becomes a PENDING AccountRequest; only the Super Admin can turn it into
    a real client account (approve) or decline it (reject). */
export type AccountRequestStatus = "pending" | "approved" | "rejected";

export interface AccountRequest {
  id: string;
  name: string;
  email: string;
  passwordHash: ClientPasswordHash; // the credentials chosen at sign-up — activated on approval
  phone: string;
  country: string;
  address: string;
  status: AccountRequestStatus;
  createdAtISO: string;
  reviewedAtISO?: string;
  reviewedBy?: string;
  rejectReason?: string;
  clientId?: string; // set on approval — links the request to the created client
}

/** Admin-facing request payload — never exposes the password hash. */
export type PublicAccountRequest = Omit<AccountRequest, "passwordHash">;

export type AuditAction =
  | "Approve Account Request"
  | "Reject Account Request"
  | "Create Transaction"
  | "Update Transaction"
  | "Delete Transaction"
  | "Create Client"
  | "Update Client"
  | "Delete Client"
  | "Update Withdrawal"
  | "Create Withdrawal"
  | "Update Staff"
  | "Create Staff"
  | "Create Role"
  | "Update Role"
  | "Sign In"
  | "Send Notification"
  | "Change Password"
  | "Update Rates";

export interface AuditEntry {
  id: string;
  date: string; // "Sep 14, 2026, 01:39 PM"
  admin: string;
  action: AuditAction;
  entity: "TRANSACTION" | "USER" | "WITHDRAWAL" | "STAFF" | "ROLE" | "SESSION" | "NOTIFICATION";
  detailsNew: string;
  detailsOld?: string;
  ip: string;
}

export interface ClientComment {
  id: string;
  clientId: string;
  author: string;
  time: string;
  body: string;
  createdAtISO: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  passwordHash?: ClientPasswordHash;
  role: string;
  status: "ACTIVE";
  lastLogin: string;
  you?: boolean;
}

export interface AdminRole {
  id: string;
  name: string;
  allAccess?: boolean;
  permissions: string[];
  staffCount: number;
}

export interface AdminUser {
  email: string;
  name: string;
  passwordHash: ClientPasswordHash;
}

export interface Session {
  token: string;
  role: "admin" | "client";
  clientId?: string;
  email: string;
  createdAtISO: string;
}

export interface DbData {
  clients: Client[];
  accountRequests: AccountRequest[];
  txs: Tx[];
  notifications: Notification[];
  audit: AuditEntry[];
  comments: ClientComment[];
  staff: StaffMember[];
  roles: AdminRole[];
  sessions: Session[];
  adminUser: AdminUser;
  fx: Record<CurrencyCode, number>; // reference rates for display-currency conversion
}

/* ---------------- computed financials (derived, never stored) ------- */

export interface ComputedFinancials {
  balance: number; // opening balance + completed credits - completed debits (floored at 0)
  available: number; // balance - pending withdrawals
  credits: number; // Σ completed CREDIT
  debits: number; // Σ completed DEBIT
  pendingWithdrawals: number; // Σ pending/processing withdrawal debits
  txCount: number;
}

/** Client-facing payload — never contains password hashes or other clients' data. */
export interface ClientView {
  client: PublicClient;
  financials: ComputedFinancials;
  txs: Tx[];
  notifications: Notification[];
  fx: Record<string, number>; // admin-managed reference rates (USD-based)
}

export type PublicClient = Omit<Client, "passwordHash">;
export type PublicStaffMember = Omit<StaffMember, "passwordHash"> & { hasPassword: boolean };

/** Admin payload — clients + financials, all txs, notifications, audit, comments, staff. */
export interface AdminSnapshot {
  clients: Array<PublicClient & { financials: ComputedFinancials; hasPortalPassword: boolean }>;
  accountRequests: PublicAccountRequest[];
  txs: Array<Tx & { clientName: string; balanceAfter: number }>;
  notifications: Notification[];
  audit: AuditEntry[];
  comments: Record<string, ClientComment[]>;
  staff: PublicStaffMember[];
  roles: AdminRole[];
  stats: AdminStats;
  fx: Record<string, number>; // admin-managed reference rates (USD-based)
}

export interface AdminStats {
  totalClients: number;
  activeClients: number;
  totalBalance: number;
  volume: number; // Σ completed tx amounts
  credits: number;
  debits: number;
  pendingWithdrawals: number; // count of pending withdrawal requests
  pendingAccountRequests: number; // registration requests awaiting Super Admin review
  txCount: number;
  requestCounts: Record<TxStatus, number>; // live counts per request status
}

/* ---------------- API request shapes ---------------- */

export type AuthAction =
  | { action: "client-login"; email: string; password: string }
  | { action: "client-register"; name: string; email: string; password: string; phone?: string; country?: string; address?: string }
  | { action: "admin-login"; email: string; password: string }
  | { action: "logout" };

export type ClientAction =
  | {
      action: "request-transaction";
      kind: "deposit" | "withdrawal" | "trade";
      amount: number;
      asset?: string;
      destination?: string;
      note?: string;
      method?: string;
    }
  | { action: "cancel-request"; id: string }
  | { action: "set-currency"; currency: CurrencyCode }
  | { action: "update-profile"; phone?: string; country?: string; address?: string; city?: string; postcode?: string }
  | { action: "change-password"; current: string; next: string }
  | { action: "mark-read"; ids: "all" | string[] };

export type AdminAction =
  | { action: "create-client"; client: NewClientInput }
  | { action: "update-client"; id: string; patch: UpdateClientInput }
  | { action: "delete-client"; id: string }
  | { action: "approve-request"; id: string }
  | { action: "reject-request"; id: string; reason?: string }
  | { action: "create-transaction"; tx: NewTxInput }
  | { action: "update-transaction"; id: string; patch: UpdateTxInput }
  | { action: "delete-transaction"; id: string }
  | { action: "set-transaction-status"; id: string; status: TxStatus; note?: string; internalNote?: string }
  | { action: "send-notification"; clientId: string; title: string; body: string }
  | { action: "set-rates"; rates: Record<string, number> }
  | { action: "mark-read"; id: string }
  | { action: "mark-all-read" }
  | { action: "add-comment"; clientId: string; body: string }
  | { action: "add-staff"; name: string; email: string; role: string; password: string }
  | { action: "remove-staff"; id: string }
  | { action: "change-admin-password"; current: string; next: string };

export interface NewClientInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
  address?: string;
  city?: string;
  postcode?: string;
  openingBalance?: number;
  sourceOfFunds?: string; // free-text compliance note, stored on the client record
}

export interface UpdateClientInput {
  name?: string;
  email?: string;
  password?: string; // set a new portal password (write-only)
  phone?: string;
  country?: string;
  address?: string;
  city?: string;
  postcode?: string;
  accountNo?: string;
  agent?: string;
  tier?: ClientTier;
  status?: ClientStatus;
  kycStatus?: KycStatus;
  managerNote?: string;
  sourceOfFunds?: string; // free text, shown on the client account
  currency?: CurrencyCode; // display-currency preference
  openingBalance?: number;
  holdings?: Holding[];
}

export interface NewTxInput {
  clientId: string;
  dateISO?: string;
  kind: TxKind;
  type: TxType;
  amount: number;
  status?: TxStatus;
  label?: string;
  asset?: string;
  method?: string;
  notes?: string;
}

export interface UpdateTxInput {
  dateISO?: string;
  kind?: TxKind;
  type?: TxType;
  amount?: number;
  status?: TxStatus;
  label?: string;
  asset?: string;
  destination?: string;
  adminNote?: string;
  method?: string;
  notes?: string;
}
