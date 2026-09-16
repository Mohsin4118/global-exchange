"use client";

import { Fragment, useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, Pencil, Plus } from "lucide-react";
import { usd, type TxType, type WithdrawalStatus } from "@/lib/admin-data";
import type { AdminCtx } from "./types";
import {
  Card,
  Modal,
  MonoId,
  OutlineButton,
  PageHeader,
  PrimaryButton,
  SearchInput,
  Select,
  StatusBadge,
  TextInput,
} from "./ui";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

/* ================= TRANSACTIONS ================= */

export function TransactionsPage({ ctx }: { ctx: AdminCtx }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [pageIdx, setPageIdx] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const filtered = useMemo(
    () =>
      ctx.state.transactions.filter((t) => {
        const q = query.trim().toLowerCase();
        const matchQ =
          !q ||
          t.clientName.toLowerCase().includes(q) ||
          t.reference.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q);
        const matchT = !type || t.type === type;
        const matchS = !status || t.status === status;
        return matchQ && matchT && matchS;
      }),
    [ctx.state.transactions, query, type, status],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(pageIdx, pageCount - 1);
  const rows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="View and manage all platform transactions."
        right={
          <PrimaryButton onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" /> New Transaction
          </PrimaryButton>
        }
      />

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <SearchInput value={query} onChange={(v) => { setQuery(v); setPageIdx(0); }} placeholder="Search by description, reference, or notes..." />
          <Select
            className="lg:w-40"
            value={type}
            onChange={(v) => { setType(v); setPageIdx(0); }}
            placeholder="All Types"
            options={[
              { value: "CREDIT", label: "Credit" },
              { value: "DEBIT", label: "Debit" },
            ]}
          />
          <Select
            className="lg:w-44"
            value={status}
            onChange={(v) => { setStatus(v); setPageIdx(0); }}
            placeholder="All Statuses"
            options={[
              { value: "COMPLETED", label: "Completed" },
              { value: "PENDING", label: "Pending" },
              { value: "FAILED", label: "Failed" },
            ]}
          />
        </div>
      </Card>

      <Card className="mt-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[13px] font-medium text-slate-500">
                <th className="w-10 px-4 py-4" />
                <th className="px-2 py-4 font-medium">ID</th>
                <th className="px-4 py-4 font-medium">Date</th>
                <th className="px-4 py-4 font-medium">Client</th>
                <th className="px-4 py-4 font-medium">Type</th>
                <th className="px-4 py-4 text-right font-medium">Amount</th>
                <th className="px-4 py-4 font-medium">Status</th>
                <th className="px-6 py-4 text-right font-medium">Balance After</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <TxRow key={t.id} tx={t} expanded={expanded === t.id} onToggle={() => setExpanded(expanded === t.id ? null : t.id)} />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center text-sm text-slate-500">No transactions match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
          <p className="text-[13px] text-slate-500">
            Showing {filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1}–{Math.min(filtered.length, (safePage + 1) * PAGE_SIZE)} of {filtered.length} transactions
          </p>
          <div className="flex items-center gap-2">
            <OutlineButton className="px-3 py-1.5 text-[13px]" disabled={safePage === 0} onClick={() => setPageIdx((p) => Math.max(0, p - 1))}>
              <ArrowLeft className="h-3.5 w-3.5" /> Prev
            </OutlineButton>
            <OutlineButton className="px-3 py-1.5 text-[13px]" disabled={safePage >= pageCount - 1} onClick={() => setPageIdx((p) => Math.min(pageCount - 1, p + 1))}>
              Next <ChevronRightIcon />
            </OutlineButton>
          </div>
        </div>
      </Card>

      <NewTxModal open={newOpen} onClose={() => setNewOpen(false)} ctx={ctx} />
    </div>
  );
}

function TxRow({ tx, expanded, onToggle }: { tx: AdminCtx["state"]["transactions"][number]; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr className="cursor-pointer border-b border-slate-50 transition-colors hover:bg-slate-50/60" onClick={onToggle}>
        <td className="px-4 py-4">
          <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", expanded && "rotate-180")} />
        </td>
        <td className="px-2 py-4"><MonoId id={tx.id} /></td>
        <td className="whitespace-nowrap px-4 py-4 text-slate-600">{tx.date}</td>
        <td className="max-w-[280px] truncate px-4 py-4 font-semibold text-slate-900">{tx.clientName}</td>
        <td className={cn("px-4 py-4 text-[13px] font-semibold", tx.type === "CREDIT" ? "text-emerald-500" : "text-amber-600")}>{tx.type}</td>
        <td className={cn("whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums", tx.type === "CREDIT" ? "text-emerald-500" : "text-amber-600")}>
          {tx.type === "CREDIT" ? "+" : "-"}{usd(tx.amount)}
        </td>
        <td className="px-4 py-4"><StatusBadge status={tx.status} /></td>
        <td className="whitespace-nowrap px-6 py-4 text-right font-bold tabular-nums text-slate-900">{usd(tx.balanceAfter)}</td>
      </tr>
      {expanded && (
        <tr className="border-b border-slate-50 bg-slate-50/70">
          <td />
          <td colSpan={7} className="px-4 pb-5">
            <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-100 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
              <Detail label="Reference" value={tx.reference} mono />
              <Detail label="Method" value={tx.method} />
              <Detail label="Notes" value={tx.notes} />
              <Detail label="Transaction Date" value={tx.dateISO} mono />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={cn("mt-1 break-words text-sm text-slate-800", mono && "font-mono text-[13px]")}>{value}</p>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function NewTxModal({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: AdminCtx }) {
  const [clientId, setClientId] = useState("");
  const [type, setType] = useState<TxType>("CREDIT");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Bank Transfer");
  const [notes, setNotes] = useState("");

  const submit = () => {
    const value = parseFloat(amount);
    if (!clientId) {
      ctx.toast("Select a client", "Choose which client this transaction belongs to.");
      return;
    }
    if (!value || value <= 0) {
      ctx.toast("Invalid amount", "Enter an amount greater than zero.");
      return;
    }
    ctx.createTransaction({ clientId, type, amount: value, method, notes });
    setClientId(""); setType("CREDIT"); setAmount(""); setMethod("Bank Transfer"); setNotes("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New Transaction">
      <div className="space-y-4">
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Client *</span>
          <Select
            value={clientId}
            onChange={setClientId}
            placeholder="Select client"
            options={ctx.state.clients.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Type *</span>
            <Select
              value={type}
              onChange={(v) => setType(v as TxType)}
              options={[
                { value: "CREDIT", label: "Credit (deposit)" },
                { value: "DEBIT", label: "Debit (withdrawal)" },
              ]}
            />
          </div>
          <TextInput label="Amount (USD) *" type="number" value={amount} onChange={setAmount} placeholder="0.00" />
        </div>
        <TextInput label="Method" value={method} onChange={setMethod} />
        <TextInput label="Notes" value={notes} onChange={setNotes} placeholder="Optional" />
        <div className="flex justify-end gap-3 pt-2">
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton onClick={submit}>Create Transaction</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

/* ================= WITHDRAWALS ================= */

const W_STATUSES: WithdrawalStatus[] = ["PENDING", "PROCESSING", "COMPLETED", "REJECTED"];

export function WithdrawalsPage({ ctx }: { ctx: AdminCtx }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const filtered = ctx.state.withdrawals.filter((w) => {
    const q = query.trim().toLowerCase();
    const matchQ = !q || w.clientName.toLowerCase().includes(q) || w.address.toLowerCase().includes(q);
    const matchS = !status || w.status === status;
    return matchQ && matchS;
  });

  const editingW = ctx.state.withdrawals.find((w) => w.id === editing) ?? null;

  return (
    <div>
      <PageHeader title="Withdrawal Requests" subtitle="Review and manage client withdrawal requests." />

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput value={query} onChange={setQuery} placeholder="Search by client or destination address..." />
          <Select
            className="sm:w-44"
            value={status}
            onChange={setStatus}
            placeholder="All Statuses"
            options={W_STATUSES.map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() }))}
          />
        </div>
      </Card>

      <Card className="mt-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[13px] font-medium text-slate-500">
                <th className="w-10 px-4 py-4" />
                <th className="px-2 py-4 font-medium">Date</th>
                <th className="px-4 py-4 font-medium">Client</th>
                <th className="px-4 py-4 font-medium">Coin</th>
                <th className="px-4 py-4 text-right font-medium">Amount</th>
                <th className="px-4 py-4 font-medium">Status</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => (
                <Fragment key={w.id}>
                  <tr className="border-b border-slate-50 transition-colors hover:bg-slate-50/60">
                    <td className="cursor-pointer px-4 py-4" onClick={() => setExpanded(expanded === w.id ? null : w.id)}>
                      <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", expanded === w.id && "rotate-180")} />
                    </td>
                    <td className="whitespace-nowrap px-2 py-4 text-slate-600">{w.date}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">{w.clientName}</td>
                    <td className="px-4 py-4 font-medium text-slate-700">{w.coin}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-right font-mono text-[13px] tabular-nums text-slate-900">{w.amount}</td>
                    <td className="px-4 py-4"><StatusBadge status={w.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <OutlineButton className="px-3 py-1.5 text-[13px]" onClick={() => setEditing(w.id)}>
                        <Pencil className="h-3.5 w-3.5" /> Update
                      </OutlineButton>
                    </td>
                  </tr>
                  {expanded === w.id && (
                    <tr className="border-b border-slate-50 bg-slate-50/70">
                      <td />
                      <td colSpan={6} className="px-4 pb-5">
                        <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-100 bg-white p-5 sm:grid-cols-2">
                          <Detail label="Destination Address" value={w.address} mono />
                          <Detail label="Network" value={w.network} />
                          {w.notes && <Detail label="Admin Notes" value={w.notes} />}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center text-sm text-slate-500">No withdrawal requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <UpdateWithdrawalModal
        withdrawal={editingW}
        onClose={() => setEditing(null)}
        onSave={(status, notes) => {
          if (editingW) ctx.updateWithdrawal(editingW.id, status, notes);
          setEditing(null);
        }}
      />
    </div>
  );
}

function UpdateWithdrawalModal({
  withdrawal,
  onClose,
  onSave,
}: {
  withdrawal: AdminCtx["state"]["withdrawals"][number] | null;
  onClose: () => void;
  onSave: (status: WithdrawalStatus, notes: string) => void;
}) {
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");

  const close = () => {
    setStatus("");
    setNotes("");
    onClose();
  };

  return (
    <Modal open={!!withdrawal} onClose={close} title="Update Withdrawal Status">
      {withdrawal && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {withdrawal.clientName} — {withdrawal.amount} {withdrawal.coin}
          </p>
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-slate-600">New Status *</span>
            <Select
              value={status}
              onChange={setStatus}
              placeholder="Select new status"
              options={W_STATUSES.map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() }))}
            />
          </div>
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Admin Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes visible to internal staff"
              rows={3}
              className="w-full resize-y rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <OutlineButton onClick={close}>Cancel</OutlineButton>
            <PrimaryButton
              disabled={!status}
              onClick={() => {
                onSave(status as WithdrawalStatus, notes.trim());
                setStatus("");
                setNotes("");
              }}
            >
              Save Status
            </PrimaryButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
