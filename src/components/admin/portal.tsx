"use client";

import { useEffect, useState } from "react";
import { Check, KeyRound, Plus, Trash2, UserCog, X } from "lucide-react";
import { INITIAL_COINS, STOCKS } from "@/lib/market";
import {
  deletePortalAccount,
  emailTaken,
  getAllAccounts,
  getAllPortalRequests,
  setPortalRequestStatus,
  updatePortalAccount,
  type ClientAccount,
  type ClientTx,
  type PortalRequest,
} from "@/lib/client-auth";
import { usd } from "@/lib/admin-data";
import type { AdminCtx } from "./types";
import { Card, Modal, OutlineButton, PageHeader, PrimaryButton, Select, StatusBadge, TextInput } from "./ui";
import { cn } from "@/lib/utils";

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

const KIND_OPTIONS = [
  { value: "deposit", label: "Deposit" },
  { value: "withdrawal", label: "Withdrawal" },
  { value: "trade", label: "Trade" },
  { value: "admin", label: "Admin adjustment" },
  { value: "opening", label: "Opening deposit" },
];

const DIR_OPTIONS = [
  { value: "in", label: "Credit (money in)" },
  { value: "out", label: "Debit (money out)" },
];

const TX_STATUS_OPTIONS = [
  { value: "Completed", label: "Completed" },
  { value: "Processing", label: "Processing" },
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultTxLabel(kind: string, dir: string): string {
  if (kind === "trade") return dir === "in" ? "Sell order" : "Buy order";
  if (kind === "withdrawal") return "Withdrawal to bank";
  if (kind === "opening") return "Account opening deposit";
  if (kind === "admin") return dir === "in" ? "Credit by Super Admin" : "Debit by Super Admin";
  return dir === "in" ? "Deposit received" : "Withdrawal processed";
}

/* ================= PORTAL CLIENTS PAGE ================= */

export function PortalClientsPage({ ctx }: { ctx: AdminCtx }) {
  const [accounts, setAccounts] = useState<ClientAccount[]>([]);
  const [requests, setRequests] = useState<PortalRequest[]>([]);
  const [managing, setManaging] = useState<ClientAccount | null>(null);
  const [toDelete, setToDelete] = useState<ClientAccount | null>(null);

  const refresh = () => {
    setAccounts(getAllAccounts());
    setRequests(getAllPortalRequests());
  };

  useEffect(() => {
    const load = () => {
      setAccounts(getAllAccounts());
      setRequests(getAllPortalRequests());
    };
    load();
  }, []);

  const decide = (r: PortalRequest, status: "Approved" | "Rejected") => {
    setPortalRequestStatus(r.id, status);
    ctx.pushAudit(
      "Update Portal Request",
      "TRANSACTION",
      JSON.stringify({ requestId: r.id, client: r.accountName, type: r.type, amount: r.amount, status }),
    );
    ctx.toast(
      status === "Approved" ? "Request approved" : "Request rejected",
      status === "Approved"
        ? `${r.accountName}'s cash balance and statement were updated.`
        : `${r.accountName} will see the decision on their dashboard.`,
    );
    refresh();
  };

  const pending = requests.filter((r) => r.status === "Pending");
  const handled = requests.filter((r) => r.status !== "Pending").slice(0, 4);

  return (
    <div>
      <PageHeader
        title="Portal Clients"
        subtitle="Full control over every client dashboard — balances, holdings, statements, access and status."
      />

      {/* ---- Client requests raised from client dashboards ---- */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <KeyRound className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Client Requests</h2>
              <p className="text-xs text-slate-500">Deposit and withdrawal requests raised from client dashboards.</p>
            </div>
          </div>
          {pending.length > 0 && <StatusBadge status="PENDING" />}
        </div>

        {pending.length === 0 ? (
          <p className="mt-4 rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm text-slate-500">
            No pending requests right now. Requests submitted by clients appear here for approval.
          </p>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {pending.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {r.accountName} <span className="font-mono text-xs text-slate-400">{r.accountNo}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {r.type === "deposit" ? "Deposit request" : "Withdrawal request"} · {r.createdAtLabel}
                    {r.note ? ` · “${r.note}”` : ""}
                  </p>
                </div>
                <span className={cn("whitespace-nowrap text-sm font-bold tabular-nums", r.type === "deposit" ? "text-emerald-600" : "text-amber-600")}>
                  {r.type === "deposit" ? "+" : "−"}
                  {usd(r.amount)}
                </span>
                <div className="flex items-center gap-2">
                  <PrimaryButton className="px-3 py-1.5 text-[13px]" onClick={() => decide(r, "Approved")}>
                    <Check className="h-4 w-4" /> Approve
                  </PrimaryButton>
                  <OutlineButton className="px-3 py-1.5 text-[13px]" onClick={() => decide(r, "Rejected")}>
                    <X className="h-4 w-4" /> Reject
                  </OutlineButton>
                </div>
              </li>
            ))}
          </ul>
        )}

        {handled.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-400">Recently handled</p>
            <ul className="mt-2 space-y-1.5">
              {handled.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-2 text-[13px] text-slate-500">
                  <StatusBadge status={r.status === "Approved" ? "COMPLETED" : "REJECTED"} />
                  <span className="font-semibold text-slate-700">{r.accountName}</span>
                  <span>{r.type === "deposit" ? "deposit" : "withdrawal"}</span>
                  <span className="font-bold tabular-nums text-slate-700">{usd(r.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* ---- Portal accounts table ---- */}
      <Card className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 pt-5">
          <h2 className="text-[15px] font-bold text-slate-900">Portal Accounts</h2>
          <p className="text-xs text-slate-500">Every figure below is exactly what the client sees on their dashboard.</p>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[13px] font-medium text-slate-500">
                <th className="px-6 py-3.5 font-medium">Client</th>
                <th className="px-4 py-3.5 font-medium">Account No.</th>
                <th className="px-4 py-3.5 font-medium">Tier</th>
                <th className="px-4 py-3.5 text-right font-medium">Cash</th>
                <th className="px-4 py-3.5 text-right font-medium">Holdings</th>
                <th className="px-4 py-3.5 font-medium">Status</th>
                <th className="px-6 py-3.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/60">
                  <td className="max-w-[260px] px-6 py-4">
                    <p className="truncate font-semibold text-slate-900">{a.name}</p>
                    <p className="truncate text-xs text-slate-500">{a.email}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-mono text-[13px] text-slate-600">{a.accountNo}</td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
                        a.tier === "Private" ? "bg-amber-50 text-amber-600" : a.tier === "Premium" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {a.tier}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right font-bold tabular-nums text-slate-900">{usd(a.cash)}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-right text-slate-600">
                    {a.holdings.length} {a.holdings.length === 1 ? "asset" : "assets"}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={a.status === "active" ? "ACTIVE" : "SUSPENDED"} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => {
                          setManaging({ ...a, holdings: a.holdings.map((h) => ({ ...h })), txs: [...a.txs] });
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                      >
                        <UserCog className="h-4 w-4" /> Manage
                      </button>
                      {!a.isDemo && (
                        <button
                          onClick={() => setToDelete(a)}
                          aria-label={`Delete ${a.name}`}
                          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:bg-amber-50 hover:text-amber-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center text-sm text-slate-500">
                    No portal accounts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {managing && <ManagePortalModal ctx={ctx} draft={managing} onClose={() => setManaging(null)} onSaved={refresh} />}

      <Modal open={toDelete !== null} onClose={() => setToDelete(null)} title="Delete Portal Account">
        <p className="text-sm leading-relaxed text-slate-600">
          Remove <span className="font-semibold text-slate-900">{toDelete?.name}</span> ({toDelete?.email}) from the client
          portal? Their dashboard, statement and pending requests will be removed. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <OutlineButton onClick={() => setToDelete(null)}>Cancel</OutlineButton>
          <PrimaryButton
            onClick={() => {
              if (!toDelete) return;
              const ok = deletePortalAccount(toDelete.id);
              if (ok) {
                ctx.pushAudit("Delete Portal Client", "USER", JSON.stringify({ email: toDelete.email, name: toDelete.name, accountNo: toDelete.accountNo }));
                ctx.toast("Portal account deleted", `${toDelete.name} can no longer sign in.`);
              } else {
                ctx.toast("Cannot delete", "The demo account cannot be deleted.");
              }
              setToDelete(null);
              refresh();
            }}
          >
            Delete Account
          </PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}

/* ================= MANAGE MODAL (full control) ================= */

function ManagePortalModal({
  ctx,
  draft: initial,
  onClose,
  onSaved,
}: {
  ctx: AdminCtx;
  draft: ClientAccount;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<ClientAccount>(initial);
  const [txForm, setTxForm] = useState({ dir: "in", amount: "", label: "", kind: "deposit", status: "Completed", apply: true });

  const set = (patch: Partial<ClientAccount>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const setHolding = (i: number, patch: Partial<ClientAccount["holdings"][number]>) =>
    setDraft((d) => (d ? { ...d, holdings: d.holdings.map((h, idx) => (idx === i ? { ...h, ...patch } : h)) } : d));

  const usedIds = draft.holdings.map((h) => h.assetId);
  const availableAssets = ASSET_OPTIONS.filter((o) => !usedIds.includes(o.value));

  const save = () => {
    const email = draft.email.trim().toLowerCase();
    if (!draft.name.trim() || !email || !draft.password.trim()) {
      ctx.toast("Missing information", "Name, email and portal password are required.");
      return;
    }
    if (emailTaken(email, draft.id)) {
      ctx.toast("Email already used", "Another portal account already uses this email.");
      return;
    }
    const next = updatePortalAccount(draft.id, {
      name: draft.name.trim(),
      email,
      password: draft.password,
      phone: draft.phone,
      country: draft.country,
      tier: draft.tier,
      status: draft.status,
      managerNote: draft.managerNote,
      cash: Math.max(0, Number(draft.cash) || 0),
      holdings: draft.holdings.filter((h) => h.units > 0),
    });
    if (next) {
      ctx.pushAudit(
        "Update Portal Client",
        "USER",
        JSON.stringify({
          email,
          name: next.name,
          cash: next.cash,
          tier: next.tier,
          status: next.status,
          holdings: next.holdings.length,
          managerNote: next.managerNote ? "set" : "—",
          passwordChanged: next.password !== initial.password,
        }),
      );
      ctx.toast("Portal updated", `${next.name}'s dashboard now reflects these figures.`);
      onSaved();
      onClose();
    }
  };

  const addTx = () => {
    const amount = parseFloat(txForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      ctx.toast("Invalid amount", "Enter a positive amount for the statement line.");
      return;
    }
    const tx: ClientTx = {
      id: `tx${Math.random().toString(36).slice(2, 10)}`,
      dateISO: todayISO(),
      kind: txForm.kind as ClientTx["kind"],
      label: txForm.label.trim() || defaultTxLabel(txForm.kind, txForm.dir),
      amountUsd: amount,
      dir: txForm.dir as ClientTx["dir"],
      status: txForm.status as ClientTx["status"],
    };
    const cashDelta = txForm.apply && tx.status === "Completed" ? (tx.dir === "in" ? amount : -amount) : 0;
    const nextTxs = [tx, ...draft.txs];
    const nextCash = Math.max(0, draft.cash + cashDelta);
    setDraft({ ...draft, txs: nextTxs, cash: nextCash });
    updatePortalAccount(draft.id, { txs: nextTxs, cash: nextCash });
    ctx.pushAudit("Create Portal Transaction", "TRANSACTION", JSON.stringify({ client: draft.name, dir: tx.dir, amount, kind: tx.kind, status: tx.status, appliedToCash: cashDelta !== 0 }));
    ctx.toast("Statement updated", "The line now appears on the client dashboard.");
    setTxForm((f) => ({ ...f, amount: "", label: "" }));
  };

  const removeTx = (txId: string) => {
    const txs = draft.txs.filter((x) => x.id !== txId);
    setDraft({ ...draft, txs });
    updatePortalAccount(draft.id, { txs });
    ctx.pushAudit("Delete Portal Transaction", "TRANSACTION", JSON.stringify({ client: draft.name, txId }));
    ctx.toast("Statement line removed");
  };

  return (
    <Modal open onClose={onClose} title={`Manage Portal — ${draft.name}`} panelClassName="max-w-2xl">
      <div className="max-h-[68vh] space-y-4 overflow-y-auto pe-1">
        {/* Access & profile */}
        <section className="rounded-lg border border-slate-200 p-4">
          <p className="text-[13px] font-bold text-slate-900">Access &amp; Profile</p>
          <p className="mt-0.5 text-xs text-slate-500">Sign-in credentials and what the client sees in their header.</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextInput label="Full Name" value={draft.name} onChange={(v) => set({ name: v })} />
            <TextInput label="Email (sign-in)" type="email" value={draft.email} onChange={(v) => set({ email: v })} />
            <TextInput label="Portal Password" value={draft.password} onChange={(v) => set({ password: v })} />
            <TextInput label="Phone" value={draft.phone} onChange={(v) => set({ phone: v })} />
            <TextInput label="Country" value={draft.country} onChange={(v) => set({ country: v })} />
            <div>
              <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Account Status</span>
              <Select value={draft.status} onChange={(v) => set({ status: v as ClientAccount["status"] })} options={STATUS_OPTIONS} />
            </div>
            <div>
              <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Tier</span>
              <Select value={draft.tier} onChange={(v) => set({ tier: v as ClientAccount["tier"] })} options={TIER_OPTIONS} />
            </div>
          </div>
          <label className="mt-3 block">
            <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Manager Note (shown on the client dashboard)</span>
            <textarea
              rows={2}
              value={draft.managerNote}
              onChange={(e) => set({ managerNote: e.target.value })}
              placeholder="e.g. Your dedicated manager is available Mon–Fri, 9am–6pm GMT."
              className="w-full resize-y rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
            />
          </label>
        </section>

        {/* Cash */}
        <section className="rounded-lg border border-slate-200 p-4">
          <p className="text-[13px] font-bold text-slate-900">Cash Balance</p>
          <p className="mt-0.5 text-xs text-slate-500">The exact “Cash Available” figure on the client dashboard.</p>
          <div className="mt-3 max-w-[220px]">
            <TextInput label="Cash (USD)" type="number" value={String(draft.cash)} onChange={(v) => set({ cash: parseFloat(v) || 0 })} />
          </div>
        </section>

        {/* Holdings */}
        <section className="rounded-lg border border-slate-200 p-4">
          <p className="text-[13px] font-bold text-slate-900">Holdings</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Units per asset — valued on the dashboard with live market prices (crypto, Aramco and Salek).
          </p>
          <div className="mt-3 space-y-2">
            {draft.holdings.map((h, i) => (
              <div key={`${h.assetId}-${i}`} className="flex items-center gap-2">
                <Select
                  className="flex-1"
                  value={h.assetId}
                  onChange={(v) => setHolding(i, { assetId: v })}
                  options={ASSET_OPTIONS.filter((o) => !usedIds.includes(o.value) || o.value === h.assetId)}
                />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={h.units}
                  onChange={(e) => setHolding(i, { units: parseFloat(e.target.value) || 0 })}
                  aria-label="Units"
                  dir="ltr"
                  className="h-11 w-28 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                />
                <button
                  onClick={() => set({ holdings: draft.holdings.filter((_, idx) => idx !== i) })}
                  aria-label="Remove holding"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {availableAssets.length > 0 && (
              <OutlineButton
                className="w-full"
                onClick={() => set({ holdings: [...draft.holdings, { assetId: availableAssets[0].value, units: 0 }] })}
              >
                <Plus className="h-4 w-4" /> Add Asset
              </OutlineButton>
            )}
          </div>
        </section>

        {/* Statement */}
        <section className="rounded-lg border border-slate-200 p-4">
          <p className="text-[13px] font-bold text-slate-900">Statement</p>
          <p className="mt-0.5 text-xs text-slate-500">Add or remove lines on the client’s transaction statement.</p>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Select value={txForm.dir} onChange={(v) => setTxForm((f) => ({ ...f, dir: v }))} options={DIR_OPTIONS} />
            <Select value={txForm.kind} onChange={(v) => setTxForm((f) => ({ ...f, kind: v }))} options={KIND_OPTIONS} />
            <Select value={txForm.status} onChange={(v) => setTxForm((f) => ({ ...f, status: v }))} options={TX_STATUS_OPTIONS} />
            <input
              type="number"
              min="0"
              step="any"
              value={txForm.amount}
              onChange={(e) => setTxForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="Amount (USD)"
              aria-label="Amount (USD)"
              dir="ltr"
              className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
            />
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={txForm.label}
              onChange={(e) => setTxForm((f) => ({ ...f, label: e.target.value }))}
              placeholder={`Label (default: “${defaultTxLabel(txForm.kind, txForm.dir)}”)`}
              className="h-11 flex-1 rounded-lg border border-slate-200 px-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
            />
            <label className="flex shrink-0 items-center gap-2 text-[13px] font-medium text-slate-600">
              <input
                type="checkbox"
                checked={txForm.apply}
                onChange={(e) => setTxForm((f) => ({ ...f, apply: e.target.checked }))}
                className="h-4 w-4 accent-emerald-600"
              />
              Apply to cash balance
            </label>
            <PrimaryButton className="shrink-0 px-4 py-2 text-[13px]" onClick={addTx}>
              <Plus className="h-4 w-4" /> Add Line
            </PrimaryButton>
          </div>

          <div className="mt-3 max-h-52 space-y-1.5 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/60 p-2">
            {draft.txs.length === 0 && <p className="px-2 py-3 text-center text-[13px] text-slate-500">No statement lines.</p>}
            {draft.txs.map((tx) => (
              <div key={tx.id} className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-[13px]">
                <span className={cn("font-bold", tx.dir === "in" ? "text-emerald-600" : "text-amber-600")}>
                  {tx.dir === "in" ? "+" : "−"}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-slate-700">
                  {tx.labelKey ? tx.kind : tx.label}
                </span>
                <span className="hidden text-xs text-slate-400 sm:inline">{tx.dateISO}</span>
                <span className="font-bold tabular-nums text-slate-700">{usd(tx.amountUsd ?? 0)}</span>
                <button
                  onClick={() => removeTx(tx.id)}
                  aria-label="Delete statement line"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-4 flex justify-end gap-3 border-t border-slate-100 pt-4">
        <OutlineButton onClick={onClose}>Cancel</OutlineButton>
        <PrimaryButton onClick={save}>Save Changes</PrimaryButton>
      </div>
    </Modal>
  );
}
