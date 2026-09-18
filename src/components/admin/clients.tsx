"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  Eye,
  Inbox,
  MessageSquare,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  TrendingUp,
  UserCog,
  Wallet,
  X,
} from "lucide-react";
import { INITIAL_COINS, STOCKS } from "@/lib/market";
import { usd } from "@/lib/admin-data";
import { PasswordInput } from "@/components/ui/password-input";
import type { AdminCtx } from "./types";
import type { TxKind, TxStatus, TxType } from "@/lib/shared-types";
import { Card, Modal, OutlineButton, PageHeader, PrimaryButton, SearchInput, Select, StatusBadge, TextInput } from "./ui";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const ASSET_OPTIONS = [...INITIAL_COINS, ...STOCKS].map((c) => ({ value: c.id, label: `${c.name} (${c.symbol})` }));
const TIER_OPTIONS = [
  { value: "Standard", label: "Standard" },
  { value: "Premium", label: "Premium" },
  { value: "Private", label: "Private" },
];
const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];
const KYC_OPTIONS = [
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Pending" },
  { value: "unverified", label: "Unverified" },
];
const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD · US Dollar" },
  { value: "SAR", label: "SAR · Saudi Riyal" },
  { value: "KWD", label: "KWD · Kuwaiti Dinar" },
  { value: "AED", label: "AED · UAE Dirham" },
  { value: "QAR", label: "QAR · Qatari Riyal" },
  { value: "OMR", label: "OMR · Omani Rial" },
  { value: "GBP", label: "GBP · British Pound" },
];
const KIND_OPTIONS: { value: TxKind; label: string }[] = [
  { value: "deposit", label: "Deposit" },
  { value: "withdrawal", label: "Withdrawal" },
  { value: "trade", label: "Trade" },
  { value: "adjustment", label: "Admin adjustment" },
  { value: "opening", label: "Opening deposit" },
];
const TX_STATUS_OPTIONS: { value: TxStatus; label: string }[] = [
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "REJECTED", label: "Rejected" },
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ================= CLIENTS LIST ================= */

export function ClientsPage({ ctx }: { ctx: AdminCtx }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [pageIdx, setPageIdx] = useState(0);
  const [newOpen, setNewOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AdminCtx["state"]["clients"][number] | null>(null);

  const filtered = useMemo(
    () =>
      ctx.state.clients.filter((c) => {
        const q = query.trim().toLowerCase();
        const matchQ =
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone || "").toLowerCase().includes(q) ||
          c.accountNo.toLowerCase().includes(q);
        const matchS = !status || c.status === status;
        return matchQ && matchS;
      }),
    [ctx.state.clients, query, status],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(pageIdx, pageCount - 1);
  const rows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Every registered client — edit everything, control every figure they see."
        right={
          <PrimaryButton onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" /> New Client
          </PrimaryButton>
        }
      />

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput value={query} onChange={(v) => { setQuery(v); setPageIdx(0); }} placeholder="Search by name, email, phone, or account no..." />
          <Select
            className="sm:w-44"
            value={status}
            onChange={(v) => { setStatus(v); setPageIdx(0); }}
            placeholder="All Statuses"
            options={[
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspended" },
            ]}
          />
        </div>
      </Card>

      <Card className="mt-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[13px] font-medium text-slate-500">
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-4 py-4 font-medium">Email</th>
                <th className="px-4 py-4 font-medium">Country</th>
                <th className="px-4 py-4 text-right font-medium">Balance</th>
                <th className="px-4 py-4 font-medium">Status</th>
                <th className="px-4 py-4 font-medium">Transactions</th>
                <th className="px-4 py-4 font-medium">Agent</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/60">
                  <td className="max-w-[300px] truncate px-6 py-4 font-semibold text-slate-900">
                    {c.name}
                    {c.isDemo && <span className="ms-2 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">DEMO</span>}
                  </td>
                  <td className="max-w-[240px] truncate px-4 py-4 text-slate-600">{c.email}</td>
                  <td className="px-4 py-4 text-slate-600">{c.country || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-right font-bold tabular-nums text-slate-900">{usd(c.financials.balance)}</td>
                  <td className="px-4 py-4"><StatusBadge status={c.status === "active" ? "ACTIVE" : "SUSPENDED"} /></td>
                  <td className="px-4 py-4 text-slate-600">{c.financials.txCount}</td>
                  <td className="px-4 py-4 text-slate-600">{c.agent || "—"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => ctx.navigate("client-detail", c.id)}
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                      >
                        <Eye className="h-4 w-4" /> View
                      </button>
                      <button
                        onClick={() => ctx.navigate("client-detail", c.id)}
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </button>
                      {!c.isDemo && (
                        <button
                          onClick={() => setToDelete(c)}
                          aria-label={`Delete ${c.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center text-sm text-slate-500">
                    No clients match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
          <p className="text-[13px] text-slate-500">
            Showing {filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1}–{Math.min(filtered.length, (safePage + 1) * PAGE_SIZE)} of {filtered.length} clients
          </p>
          <div className="flex items-center gap-2">
            <OutlineButton className="px-3 py-1.5 text-[13px]" disabled={safePage === 0} onClick={() => setPageIdx((p) => Math.max(0, p - 1))}>
              <ArrowLeft className="h-3.5 w-3.5" /> Prev
            </OutlineButton>
            <OutlineButton className="px-3 py-1.5 text-[13px]" disabled={safePage >= pageCount - 1} onClick={() => setPageIdx((p) => Math.min(pageCount - 1, p + 1))}>
              Next <ArrowRightIcon />
            </OutlineButton>
          </div>
        </div>
      </Card>

      <NewClientModal open={newOpen} onClose={() => setNewOpen(false)} ctx={ctx} />

      {/* delete confirmation */}
      <Modal open={toDelete !== null} onClose={() => setToDelete(null)} title="Delete Client">
        <p className="text-sm leading-relaxed text-slate-600">
          Permanently remove <span className="font-semibold text-slate-900">{toDelete?.name}</span> ({toDelete?.email})? Their dashboard access, statement, holdings
          and pending requests will be deleted. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <OutlineButton onClick={() => setToDelete(null)}>Cancel</OutlineButton>
          <PrimaryButton
            onClick={async () => {
              if (!toDelete) return;
              const ok = await ctx.runAction({ action: "delete-client", id: toDelete.id }, { title: "Client deleted", description: `${toDelete.name} can no longer sign in.` });
              if (ok) setToDelete(null);
            }}
          >
            Delete Client
          </PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function NewClientModal({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: AdminCtx }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("0.00");
  const [sof, setSof] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      ctx.toast("Missing information", "Name, email and portal password are required.");
      return;
    }
    if (password.trim().length < 6) {
      ctx.toast("Weak password", "The portal password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    const ok = await ctx.runAction(
      {
        action: "create-client",
        client: { name: name.trim(), email: email.trim(), password: password.trim(), phone: phone.trim(), country: country.trim(), address: address.trim(), openingBalance: parseFloat(balance) || 0, sourceOfFunds: sof.trim() },
      },
      {
        title: "Client created",
        description: `${name.trim()} was added. Portal access is live — ${email.trim()} can sign in and open their dashboard.`,
      },
    );
    setBusy(false);
    if (ok) {
      setName(""); setEmail(""); setPassword(""); setPhone(""); setCountry(""); setAddress(""); setBalance("0.00"); setSof("");
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Client">
      <div className="space-y-4">
        <TextInput label="Full Name *" value={name} onChange={setName} placeholder="e.g. Charlie Williams" />
        <TextInput label="Email *" type="email" value={email} onChange={setEmail} placeholder="client@email.com" />
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Portal Password *</span>
          <PasswordInput theme="light" value={password} onChange={setPassword} placeholder="Client sign-in password (min. 6 chars)" autoComplete="new-password" />
        </div>
        <p className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-slate-500">
          The client signs in on the website with this email and password — their dashboard opens with the opening balance below.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <TextInput label="Phone" value={phone} onChange={setPhone} placeholder="Optional" />
          <TextInput label="Country" value={country} onChange={setCountry} placeholder="Optional" />
        </div>
        <TextInput label="Address" value={address} onChange={setAddress} placeholder="Optional" />
        <TextInput label="Opening Balance (USD)" type="number" value={balance} onChange={setBalance} />
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Source of Funds</span>
          <textarea
            rows={3}
            value={sof}
            onChange={(e) => setSof(e.target.value)}
            placeholder="Enter the source of the client's funds… e.g. Salary, business income, investment, savings, company funds, inheritance."
            className="w-full resize-y rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
          />
          <span className="mt-1.5 block text-[12px] leading-relaxed text-slate-400">
            Free text (English or Arabic) — stored on the client record and shown on their account. You can change it at any time.
          </span>
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton onClick={submit} disabled={busy}>
            Create Client
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

/* ================= CLIENT PROFILE (full edit) ================= */

type ClientRecord = AdminCtx["state"]["clients"][number];

export function ClientDetailPage({ ctx }: { ctx: AdminCtx }) {
  const client = ctx.state.clients.find((c) => c.id === ctx.selectedClientId);
  const [form, setForm] = useState<Record<string, string> | null>(null);
  const [access, setAccess] = useState<{ password: string; tier: string; status: string; kyc: string; note: string; sof: string; currency: string; opening: string } | null>(null);
  const [holdings, setHoldings] = useState<Array<{ assetId: string; units: string }> | null>(null);
  const [note, setNote] = useState("");
  const [txForm, setTxForm] = useState({ dir: "CREDIT" as TxType, kind: "deposit" as TxKind, status: "COMPLETED" as TxStatus, amount: "", label: "", date: todayISO(), method: "Bank Transfer", asset: "", notes: "" });
  const [editingTx, setEditingTx] = useState<string | null>(null);
  const [txDraft, setTxDraft] = useState<{ dateISO: string; kind: TxKind; type: TxType; amount: string; status: TxStatus; label: string; method: string; notes: string } | null>(null);
  const [confirmDeleteTx, setConfirmDeleteTx] = useState<string | null>(null);

  // Keep drafts in sync with the server record (content-based: never clobbers
  // typing when nothing changed, always syncs after a save or external edit).
  const signature = client ? JSON.stringify([client.name, client.email, client.phone, client.country, client.address, client.city, client.postcode, client.accountNo, client.agent, client.tier, client.status, client.kycStatus, client.managerNote, client.sourceOfFunds, client.currency, client.openingBalance, client.holdings]) : "";
  useEffect(() => {
    if (!client) return;
    setForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      country: client.country,
      address: client.address,
      city: client.city,
      postcode: client.postcode,
      accountNo: client.accountNo,
      agent: client.agent,
    });
    setAccess({ password: "", tier: client.tier, status: client.status, kyc: client.kycStatus, note: client.managerNote, sof: client.sourceOfFunds ?? "", currency: client.currency ?? "USD", opening: String(client.openingBalance) });
    setHoldings(client.holdings.map((h) => ({ assetId: h.assetId, units: String(h.units) })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.selectedClientId, signature]);

  const clientTxs = useMemo(() => (client ? ctx.state.txs.filter((t) => t.clientId === client.id) : []), [ctx.state.txs, client]);

  if (!client) {
    return (
      <Card className="p-12 text-center">
        <p className="text-sm text-slate-500">Client not found.</p>
        <OutlineButton className="mt-4" onClick={() => ctx.navigate("clients")}>Back to clients</OutlineButton>
      </Card>
    );
  }

  const f = form ?? {
    name: client.name,
    email: client.email,
    phone: client.phone,
    country: client.country,
    address: client.address,
    city: client.city,
    postcode: client.postcode,
    accountNo: client.accountNo,
    agent: client.agent,
  };
  const set = (k: string, v: string) => setForm({ ...f, [k]: v });

  const saveIdentity = async () => {
    const ok = await ctx.runAction(
      {
        action: "update-client",
        id: client.id,
        patch: {
          name: f.name.trim() || client.name,
          email: f.email.trim() || client.email,
          phone: f.phone.trim(),
          country: f.country.trim(),
          address: f.address.trim(),
          city: f.city.trim(),
          postcode: f.postcode.trim(),
          accountNo: f.accountNo.trim() || client.accountNo,
          agent: f.agent.trim(),
        },
      },
      { title: "Changes saved", description: "Client details were updated everywhere in the system." },
    );
    if (ok) ctx.toast("Synchronized", "The client dashboard, statements and reports now show the same details.");
  };

  const saveAccess = async () => {
    if (!access) return;
    if (access.password && access.password.length < 6) {
      ctx.toast("Weak password", "The portal password must be at least 6 characters.");
      return;
    }
    const ok = await ctx.runAction(
      {
        action: "update-client",
        id: client.id,
        patch: {
          ...(access.password ? { password: access.password } : {}),
          tier: access.tier as ClientRecord["tier"],
          status: access.status as ClientRecord["status"],
          kycStatus: access.kyc as ClientRecord["kycStatus"],
          managerNote: access.note,
          sourceOfFunds: access.sof,
          currency: access.currency as ClientRecord["currency"],
          openingBalance: parseFloat(access.opening) || 0,
        },
      },
      { title: "Portal updated", description: "Access, tier, status, note, source of funds, currency and opening balance now match on the client dashboard." },
    );
    if (ok) setAccess((a) => (a ? { ...a, password: "" } : a));
  };

  const saveHoldings = async () => {
    if (!holdings) return;
    const seen = new Set<string>();
    const clean = holdings
      .filter((h) => {
        if (seen.has(h.assetId)) return false;
        seen.add(h.assetId);
        return h.assetId && Number(h.units) > 0;
      })
      .map((h) => ({ assetId: h.assetId, units: Number(h.units) }));
    const ok = await ctx.runAction(
      { action: "update-client", id: client.id, patch: { holdings: clean } },
      { title: "Holdings updated", description: "The client dashboard now values these units at live market prices." },
    );
    if (ok) setHoldings(clean.map((h) => ({ assetId: h.assetId, units: String(h.units) })));
  };

  const comments = ctx.state.comments[client.id] ?? [];

  const addTx = async () => {
    const amount = parseFloat(txForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      ctx.toast("Invalid amount", "Enter a positive amount for the statement line.");
      return;
    }
    const ok = await ctx.runAction(
      {
        action: "create-transaction",
        tx: {
          clientId: client.id,
          kind: txForm.kind,
          type: txForm.dir,
          amount,
          status: txForm.status,
          label: txForm.label.trim() || undefined,
          asset: txForm.asset.trim() || undefined,
          dateISO: txForm.date || todayISO(),
          method: txForm.method.trim() || "Bank Transfer",
          notes: txForm.notes.trim() || "—",
        },
      },
      { title: "Transaction created", description: "Balances, statistics and the client dashboard updated instantly." },
    );
    if (ok) setTxForm((x) => ({ ...x, amount: "", label: "", asset: "", notes: "" }));
  };

  const startEditTx = (tx: AdminCtx["state"]["txs"][number]) => {
    setEditingTx(tx.id);
    setTxDraft({ dateISO: tx.dateISO, kind: tx.kind, type: tx.type, amount: String(tx.amount), status: tx.status, label: tx.label, method: tx.method, notes: tx.notes === "—" ? "" : tx.notes });
  };

  const saveEditTx = async () => {
    if (!txDraft) return;
    const amount = parseFloat(txDraft.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      ctx.toast("Invalid amount", "Enter a positive amount.");
      return;
    }
    const ok = await ctx.runAction(
      { action: "update-transaction", id: editingTx!, patch: { dateISO: txDraft.dateISO, kind: txDraft.kind, type: txDraft.type, amount, status: txDraft.status, label: txDraft.label, method: txDraft.method, notes: txDraft.notes } },
      { title: "Transaction updated", description: "Every balance, statistic and statement now reflects this change." },
    );
    if (ok) {
      setEditingTx(null);
      setTxDraft(null);
    }
  };

  const removeTx = async (id: string) => {
    const ok = await ctx.runAction({ action: "delete-transaction", id }, { title: "Transaction deleted", description: "Totals, balances and statistics were recalculated." });
    if (ok) setConfirmDeleteTx(null);
  };

  return (
    <div>
      {/* Header row */}
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => ctx.navigate("clients")}
            aria-label="Back"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="flex flex-wrap items-center gap-2 text-[28px] font-bold leading-tight tracking-tight text-slate-900">
              {client.name}
              {client.isDemo && <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">DEMO</span>}
              <StatusBadge status={client.status === "active" ? "ACTIVE" : "SUSPENDED"} />
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Client profile · <span className="font-mono">{client.accountNo}</span> · {client.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!client.isDemo && (
            <OutlineButton
              className="!text-amber-600 hover:!bg-amber-50"
              onClick={async () => {
                const ok = await ctx.runAction({ action: "delete-client", id: client.id }, { title: "Client deleted", description: `${client.name} can no longer sign in.` });
                if (ok) ctx.navigate("clients");
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </OutlineButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Personal information */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
          <p className="mt-0.5 text-[13px] text-slate-500">Saved changes appear everywhere — client dashboard, statements, reports.</p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput label="Full Name" value={f.name} onChange={(v) => set("name", v)} />
            <TextInput label="Email (sign-in)" type="email" value={f.email} onChange={(v) => set("email", v)} />
            <TextInput label="Phone" value={f.phone} onChange={(v) => set("phone", v)} />
            <TextInput label="Country" value={f.country} onChange={(v) => set("country", v)} />
            <TextInput label="Address" value={f.address} onChange={(v) => set("address", v)} />
            <div className="grid grid-cols-2 gap-4">
              <TextInput label="City" value={f.city} onChange={(v) => set("city", v)} />
              <TextInput label="Postcode" value={f.postcode} onChange={(v) => set("postcode", v)} />
            </div>
            <TextInput label="Account No. (client reference)" value={f.accountNo} onChange={(v) => set("accountNo", v)} />
            <div>
              <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Assigned Agent</span>
              <Select
                value={f.agent}
                onChange={(v) => set("agent", v)}
                placeholder="Unassigned"
                options={[
                  { value: "Super Admin", label: "Super Admin" },
                  { value: "Agent", label: "Agent" },
                ]}
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <PrimaryButton onClick={saveIdentity}>Save Personal Information</PrimaryButton>
          </div>
        </Card>

        {/* Financial summary — computed, never stale */}
        <div className="grid grid-cols-1 content-start gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900">Financial Summary</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">Always calculated live from the transaction ledger.</p>
            <div className="mt-4 divide-y divide-slate-100">
              <SummaryRow icon={<Wallet className="h-4 w-4 text-slate-400" />} label="Current Balance" value={usd(client.financials.balance)} valueClass="font-bold text-slate-900" />
              <SummaryRow icon={<Wallet className="h-4 w-4 text-slate-400" />} label="Available Funds" value={usd(client.financials.available)} valueClass="font-semibold text-slate-700" />
              <SummaryRow icon={<ArrowUpCircle className="h-4 w-4 text-emerald-500" />} label="Total Credits" value={usd(client.financials.credits)} valueClass="font-semibold text-emerald-500" />
              <SummaryRow icon={<ArrowDownCircle className="h-4 w-4 text-amber-600" />} label="Total Debits" value={usd(client.financials.debits)} valueClass="font-semibold text-amber-600" />
              <SummaryRow icon={<ShieldAlert className="h-4 w-4 text-amber-500" />} label="Pending Withdrawals" value={usd(client.financials.pendingWithdrawals)} valueClass="font-semibold text-amber-600" />
              <SummaryRow icon={<TrendingUp className="h-4 w-4 text-slate-400" />} label="Opening Balance" value={usd(client.openingBalance)} valueClass="font-semibold text-slate-600" />
              <div className="flex items-center justify-between py-4">
                <span className="text-sm text-slate-500">Total Transactions</span>
                <span className="text-sm font-bold text-slate-900">{client.financials.txCount}</span>
              </div>
            </div>
          </Card>

          {/* Access & portal control */}
          <Card className="p-6">
            <div className="flex items-center gap-2.5">
              <UserCog className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-bold text-slate-900">Access &amp; Portal Control</h2>
            </div>
            {access && (
              <div className="mt-5 space-y-4">
                <div>
                  <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Reset Portal Password</span>
                  <PasswordInput theme="light" value={access.password} onChange={(v) => setAccess({ ...access, password: v })} placeholder="Leave empty to keep current password" autoComplete="new-password" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Tier</span>
                    <Select value={access.tier} onChange={(v) => setAccess({ ...access, tier: v })} options={TIER_OPTIONS} />
                  </div>
                  <div>
                    <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Account Status</span>
                    <Select value={access.status} onChange={(v) => setAccess({ ...access, status: v })} options={STATUS_OPTIONS} />
                  </div>
                  <div>
                    <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Verification</span>
                    <Select value={access.kyc} onChange={(v) => setAccess({ ...access, kyc: v })} options={KYC_OPTIONS} />
                  </div>
                </div>
                <TextInput label="Opening Balance (USD)" type="number" value={access.opening} onChange={(v) => setAccess({ ...access, opening: v })} />
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Manager Note (shown on the client dashboard)</span>
                  <textarea
                    rows={2}
                    value={access.note}
                    onChange={(e) => setAccess({ ...access, note: e.target.value })}
                    placeholder="e.g. Your dedicated manager is available Mon–Fri, 9am–6pm GMT."
                    className="w-full resize-y rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Source of Funds (free text, shown on the client account)</span>
                  <textarea
                    rows={2}
                    value={access.sof}
                    onChange={(e) => setAccess({ ...access, sof: e.target.value })}
                    placeholder="e.g. Salary, savings and long-term investments."
                    className="w-full resize-y rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                  />
                </label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Display Currency (client dashboard)</span>
                    <Select value={access.currency} onChange={(v) => setAccess({ ...access, currency: v })} options={CURRENCY_OPTIONS} />
                  </label>
                  <div className="flex items-end pb-1">
                    <p className="text-[12px] leading-relaxed text-slate-400">Currency, note and source of funds sync to the client dashboard within seconds.</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <PrimaryButton onClick={saveAccess}>Save Access &amp; Portal</PrimaryButton>
                </div>
              </div>
            )}
          </Card>

          {/* Holdings */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900">Holdings</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">Units per asset — valued on the dashboard with live market prices.</p>
            {holdings && (
              <div className="mt-4 space-y-2">
                {holdings.map((h, i) => {
                  const used = holdings.map((x) => x.assetId);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <Select
                        className="flex-1"
                        value={h.assetId}
                        onChange={(v) => setHoldings(holdings.map((x, idx) => (idx === i ? { ...x, assetId: v } : x)))}
                        options={ASSET_OPTIONS.filter((o) => !used.includes(o.value) || o.value === h.assetId)}
                      />
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={h.units}
                        onChange={(e) => setHoldings(holdings.map((x, idx) => (idx === i ? { ...x, units: e.target.value } : x)))}
                        aria-label="Units"
                        dir="ltr"
                        className="h-11 w-28 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                      />
                      <button
                        onClick={() => setHoldings(holdings.filter((_, idx) => idx !== i))}
                        aria-label="Remove holding"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
                {ASSET_OPTIONS.some((o) => !holdings.some((h) => h.assetId === o.value)) && (
                  <OutlineButton
                    className="w-full"
                    onClick={() => {
                      const free = ASSET_OPTIONS.find((o) => !holdings.some((h) => h.assetId === o.value));
                      if (free) setHoldings([...holdings, { assetId: free.value, units: "0" }]);
                    }}
                  >
                    <Plus className="h-4 w-4" /> Add Asset
                  </OutlineButton>
                )}
                <div className="flex justify-end pt-1">
                  <PrimaryButton onClick={saveHoldings}>Save Holdings</PrimaryButton>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Statement / transactions editor */}
      <Card className="mt-6 p-6">
        <h2 className="text-lg font-bold text-slate-900">Transactions &amp; Statement</h2>
        <p className="mt-0.5 text-[13px] text-slate-500">Add, edit or remove ledger lines — balances, statistics and the client dashboard update instantly.</p>

        {/* add line */}
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Select value={txForm.dir} onChange={(v) => setTxForm({ ...txForm, dir: v as TxType })} options={[{ value: "CREDIT", label: "Credit (in)" }, { value: "DEBIT", label: "Debit (out)" }]} />
            <Select value={txForm.kind} onChange={(v) => setTxForm({ ...txForm, kind: v as TxKind })} options={KIND_OPTIONS.map((k) => ({ value: k.value, label: k.label }))} />
            <Select value={txForm.status} onChange={(v) => setTxForm({ ...txForm, status: v as TxStatus })} options={TX_STATUS_OPTIONS} />
            <input
              type="number"
              min="0"
              step="any"
              value={txForm.amount}
              onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
              placeholder="Amount (USD)"
              aria-label="Amount (USD)"
              dir="ltr"
              className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
            />
            <input
              type="date"
              value={txForm.date}
              onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
              aria-label="Date"
              className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
            />
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              value={txForm.label}
              onChange={(e) => setTxForm({ ...txForm, label: e.target.value })}
              placeholder="Description (optional)"
              className="h-11 flex-1 rounded-lg border border-slate-200 px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
            />
            <input
              value={txForm.method}
              onChange={(e) => setTxForm({ ...txForm, method: e.target.value })}
              placeholder="Method"
              className="h-11 w-full rounded-lg border border-slate-200 px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 sm:w-40"
            />
            <PrimaryButton className="shrink-0 px-4 py-2 text-[13px]" onClick={addTx}>
              <Plus className="h-4 w-4" /> Add Line
            </PrimaryButton>
          </div>
        </div>

        {/* ledger list */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[13px] font-medium text-slate-500">
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Description</th>
                <th className="px-3 py-3 font-medium">Kind</th>
                <th className="px-3 py-3 text-right font-medium">Amount</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 text-right font-medium">Balance After</th>
                <th className="px-3 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clientTxs.map((t) =>
                editingTx === t.id && txDraft ? (
                  <tr key={t.id} className="border-b border-slate-50 bg-emerald-50/30">
                    <td className="px-3 py-3">
                      <input type="date" value={txDraft.dateISO} onChange={(e) => setTxDraft({ ...txDraft, dateISO: e.target.value })} className="h-9 rounded-md border border-slate-200 px-2 text-[13px]" />
                    </td>
                    <td className="px-3 py-3">
                      <input value={txDraft.label} onChange={(e) => setTxDraft({ ...txDraft, label: e.target.value })} className="h-9 w-52 rounded-md border border-slate-200 px-2 text-[13px]" placeholder="Description" />
                    </td>
                    <td className="px-3 py-3">
                      <Select className="w-32" value={txDraft.kind} onChange={(v) => setTxDraft({ ...txDraft, kind: v as TxKind })} options={KIND_OPTIONS.map((k) => ({ value: k.value, label: k.label }))} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Select className="w-24" value={txDraft.type} onChange={(v) => setTxDraft({ ...txDraft, type: v as TxType })} options={[{ value: "CREDIT", label: "In" }, { value: "DEBIT", label: "Out" }]} />
                        <input type="number" min="0" step="any" value={txDraft.amount} onChange={(e) => setTxDraft({ ...txDraft, amount: e.target.value })} className="h-9 w-28 rounded-md border border-slate-200 px-2 text-[13px]" dir="ltr" />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Select className="w-32" value={txDraft.status} onChange={(v) => setTxDraft({ ...txDraft, status: v as TxStatus })} options={TX_STATUS_OPTIONS} />
                    </td>
                    <td className="px-3 py-3 text-end text-[13px] text-slate-400">auto</td>
                    <td className="px-3 py-3 text-end">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={saveEditTx} className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-[12px] font-bold text-white hover:bg-emerald-700">Save</button>
                        <button
                          onClick={() => {
                            setEditingTx(null);
                            setTxDraft(null);
                          }}
                          className="rounded-md px-2 py-1.5 text-[12px] font-semibold text-slate-500 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={t.id} className="border-b border-slate-50 transition-colors hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-3 py-3.5 text-slate-600">{t.dateISO}</td>
                    <td className="max-w-[280px] truncate px-3 py-3.5">
                      <span className="font-medium text-slate-800">{t.label}</span>
                      {t.notes && t.notes !== "—" && <span className="text-slate-400"> · {t.notes}</span>}
                    </td>
                    <td className="px-3 py-3.5 text-[13px] capitalize text-slate-500">{t.kind}</td>
                    <td className={cn("whitespace-nowrap px-3 py-3.5 text-right font-semibold tabular-nums", t.type === "CREDIT" ? "text-emerald-500" : "text-amber-600")} dir="ltr">
                      {t.type === "CREDIT" ? "+" : "−"}
                      {usd(t.amount)}
                    </td>
                    <td className="px-3 py-3.5"><StatusBadge status={t.status} /></td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-right font-bold tabular-nums text-slate-900" dir="ltr">
                      {usd(t.balanceAfter)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-end">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => startEditTx(t)} aria-label="Edit transaction" className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setConfirmDeleteTx(t.id)} aria-label="Delete transaction" className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
              {clientTxs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-sm text-slate-500">No transactions yet — add the first line above.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Comments */}
      <Card className="mt-6 p-6">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="h-5 w-5 text-slate-500" />
          <h2 className="text-lg font-bold text-slate-900">Comments</h2>
        </div>
        <div className="mt-5 flex items-end gap-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note about this client..."
            rows={2}
            className="w-full resize-y rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
          />
          <PrimaryButton
            className="mb-0.5 shrink-0 px-5 disabled:bg-emerald-600/40"
            disabled={!note.trim()}
            onClick={async () => {
              const ok = await ctx.runAction({ action: "add-comment", clientId: client.id, body: note.trim() }, { title: "Comment posted" });
              if (ok) setNote("");
            }}
          >
            Post
          </PrimaryButton>
        </div>
        {comments.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Inbox className="h-6 w-6 text-slate-400" />
            </span>
            <p className="mt-4 text-[15px] font-bold text-slate-900">No comments yet</p>
            <p className="mt-1 text-sm text-slate-500">Notes left by staff about this client will appear here.</p>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {comments.map((c) => (
              <li key={c.id} className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{c.author}</p>
                  <span className="text-xs text-slate-400">{c.time}</span>
                </div>
                <p className="mt-1.5 text-sm text-slate-600">{c.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* delete transaction confirmation */}
      <Modal open={confirmDeleteTx !== null} onClose={() => setConfirmDeleteTx(null)} title="Delete Transaction">
        <p className="text-sm leading-relaxed text-slate-600">
          Delete this transaction permanently? The client&apos;s balance, statement, all dashboard statistics and reports will be recalculated immediately. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <OutlineButton onClick={() => setConfirmDeleteTx(null)}>Cancel</OutlineButton>
          <PrimaryButton className="!bg-amber-600 hover:!bg-amber-700" onClick={() => confirmDeleteTx && removeTx(confirmDeleteTx)}>
            Delete Transaction
          </PrimaryButton>
        </div>
      </Modal>

      <span className="hidden"><X /></span>
    </div>
  );
}

function SummaryRow({ icon, label, value, valueClass }: { icon: React.ReactNode; label: string; value: string; valueClass: string }) {
  return (
    <div className="flex items-center justify-between py-4">
      <span className="flex items-center gap-2.5 text-sm text-slate-500">
        {icon}
        {label}
      </span>
      <span className={cn("text-sm tabular-nums", valueClass)}>{value}</span>
    </div>
  );
}

function TrendIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 7 13.5 15.5 8.5 10.5 2 17" />
      <path d="M16 7h6v6" />
    </svg>
  );
}
