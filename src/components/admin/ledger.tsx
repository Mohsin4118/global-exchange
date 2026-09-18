"use client";

import { Fragment, useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Clock, Download, Pencil, Plus, Trash2, X } from "lucide-react";
import { usd, type TxType } from "@/lib/admin-data";
import type { AdminCtx } from "./types";
import type { TxEvent, TxKind, TxStatus } from "@/lib/shared-types";
import { CURRENCIES as CURRENCY_CODES } from "@/lib/shared-types";
import { Card, Modal, MonoId, OutlineButton, PageHeader, PrimaryButton, SearchInput, Select, StatusBadge, statusLabel, TextInput } from "./ui";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

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
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "PROCESSING", label: "Processing" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];
/** Statuses that are still an open request (client funds reserved for withdrawals). */
const IN_FLIGHT: TxStatus[] = ["PENDING", "UNDER_REVIEW", "APPROVED", "PROCESSING"];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function downloadCsv(filename: string, rows: string[][]) {
  const blob = new Blob([rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ================= SHARED TX TABLE ================= */

type TxRow = AdminCtx["state"]["txs"][number];

function TxActions({ tx, ctx, onEdit, onDelete }: { tx: TxRow; ctx: AdminCtx; onEdit: () => void; onDelete: () => void }) {
  const pending = IN_FLIGHT.includes(tx.status);
  return (
    <div className="inline-flex items-center gap-1">
      {pending && (
        <>
          <button
            onClick={() => ctx.runAction({ action: "set-transaction-status", id: tx.id, status: "COMPLETED" }, { title: "Approved & completed", description: `${tx.clientName}'s ${tx.kind} ${tx.reference} is completed — balances updated everywhere.` })}
            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-emerald-700"
          >
            <Check className="h-3.5 w-3.5" /> Approve
          </button>
          <button
            onClick={() => ctx.runAction({ action: "set-transaction-status", id: tx.id, status: "REJECTED" }, { title: "Rejected", description: `${tx.clientName} will see the decision on their dashboard.` })}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[12px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" /> Reject
          </button>
        </>
      )}
      <button onClick={onEdit} aria-label="Edit transaction" className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
        <Pencil className="h-4 w-4" />
      </button>
      <button onClick={onDelete} aria-label="Delete transaction" className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ================= REQUEST MANAGER (expanded detail) ================= */

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function HistoryRow({ ev }: { ev: TxEvent }) {
  const isEdit = ev.from === ev.to;
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      <span className="relative mt-1 flex h-2.5 w-2.5 shrink-0">
        <span className={cn("h-2.5 w-2.5 rounded-full", isEdit ? "bg-slate-300" : ev.to === "COMPLETED" ? "bg-emerald-500" : ev.to === "REJECTED" || ev.to === "CANCELLED" ? "bg-slate-400" : "bg-amber-500")} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-slate-800">
          {isEdit ? (
            <>Details updated{ev.changes?.length ? <span className="font-normal text-slate-500"> · {ev.changes.join(", ")}</span> : null}</>
          ) : (
            <>
              {ev.from ? statusLabel(ev.from) : "Submitted"} <span className="text-slate-400">→</span> {statusLabel(ev.to)}
            </>
          )}
          {ev.internalNote && <span className="ms-2 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-500">Internal</span>}
        </p>
        <p className="mt-0.5 text-[11.5px] text-slate-400">
          {fmtWhen(ev.at)} · {ev.byRole === "admin" ? "Super Admin" : ev.byRole === "client" ? ev.by : "System"}
        </p>
        {(ev.note || ev.internalNote) && <p className={cn("mt-1 rounded-md px-2.5 py-1.5 text-[12px] leading-relaxed", ev.internalNote ? "bg-indigo-50/60 text-indigo-700" : "bg-slate-50 text-slate-600")}>{ev.internalNote ?? ev.note}</p>}
      </div>
    </li>
  );
}

function RequestManager({ tx, ctx, onEdit, onDelete }: { tx: TxRow; ctx: AdminCtx; onEdit: () => void; onDelete: () => void }) {
  const [status, setStatus] = useState<TxStatus>(tx.status);
  const [clientNote, setClientNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadedId, setLoadedId] = useState(tx.id);
  if (loadedId !== tx.id) {
    setLoadedId(tx.id);
    setStatus(tx.status);
    setClientNote("");
    setInternalNote("");
  }

  const decide = async (next: TxStatus, note?: string, internal?: string) => {
    setBusy(true);
    const ok = await ctx.runAction(
      { action: "set-transaction-status", id: tx.id, status: next, note: note || undefined, internalNote: internal || undefined },
      { title: `Request ${statusLabel(next).toLowerCase()}`, description: `${tx.clientName}'s ${tx.kind} ${tx.reference} → ${statusLabel(next)}. The client dashboard updates within seconds.` },
    );
    setBusy(false);
    if (ok) {
      setClientNote("");
      setInternalNote("");
      setStatus(next);
    }
  };

  const history = [...(tx.history ?? [])].reverse();

  return (
    <div className="space-y-5 rounded-lg border border-slate-100 bg-white p-5">
      {/* all request details */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Detail label="Reference" value={tx.reference} mono />
        <Detail label="Kind" value={tx.kind} />
        <Detail label="Method" value={tx.method} />
        <Detail label="Asset" value={tx.asset ?? "—"} />
        <Detail label="Destination / Details" value={tx.destination ?? "—"} />
        <Detail label="Client Note" value={tx.notes} />
        <Detail label="Internal Note (private)" value={tx.adminNote ?? "—"} />
        <Detail label="Submitted" value={fmtWhen(tx.createdAtISO)} />
      </div>

      {/* status decision box — the admin's control panel for this request */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="me-1 text-[12px] font-bold uppercase tracking-wide text-slate-400">Quick decision:</span>
          <OutlineButton className="px-3 py-1.5 text-[12.5px]" disabled={busy || tx.status === "UNDER_REVIEW"} onClick={() => decide("UNDER_REVIEW")}>
            Under Review
          </OutlineButton>
          <OutlineButton className="px-3 py-1.5 text-[12.5px]" disabled={busy || tx.status === "APPROVED"} onClick={() => decide("APPROVED")}>
            Approved
          </OutlineButton>
          <OutlineButton className="px-3 py-1.5 text-[12.5px]" disabled={busy || tx.status === "PROCESSING"} onClick={() => decide("PROCESSING")}>
            Processing
          </OutlineButton>
          <PrimaryButton className="px-3 py-1.5 text-[12.5px]" disabled={busy || tx.status === "COMPLETED"} onClick={() => decide("COMPLETED")}>
            <Check className="h-3.5 w-3.5" /> Complete
          </PrimaryButton>
          <OutlineButton className="px-3 py-1.5 text-[12.5px]" disabled={busy || tx.status === "REJECTED"} onClick={() => decide("REJECTED")}>
            <X className="h-3.5 w-3.5" /> Reject
          </OutlineButton>
          <OutlineButton className="px-3 py-1.5 text-[12.5px]" disabled={busy || tx.status === "CANCELLED"} onClick={() => decide("CANCELLED")}>
            Cancelled
          </OutlineButton>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Set status manually</span>
            <Select value={status} onChange={(v) => setStatus(v as TxStatus)} options={TX_STATUS_OPTIONS} />
          </div>
          <TextInput label="Note for the client (visible)" value={clientNote} onChange={setClientNote} placeholder="e.g. Processed via bank transfer" />
          <TextInput label="Internal note (private)" value={internalNote} onChange={setInternalNote} placeholder="e.g. KYC re-checked before approving" />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11.5px] leading-relaxed text-slate-400">
            Only <span className="font-semibold text-slate-600">Completed</span> moves the client&apos;s balance — submitting or reviewing a request never does. The client is
            notified with the reference on every decision; internal notes stay private.
          </p>
          <PrimaryButton className="px-4 py-2 text-[13px]" disabled={busy || (status === tx.status && !clientNote.trim() && !internalNote.trim())} onClick={() => decide(status, clientNote.trim(), internalNote.trim())}>
            Apply Decision
          </PrimaryButton>
        </div>
      </div>

      {/* status history / audit trail */}
      <div>
        <p className="mb-3 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-400">
          <Clock className="h-3.5 w-3.5" /> Status history — full audit trail
        </p>
        {history.length > 0 ? (
          <ol className="ms-1 border-s border-slate-100 ps-5">
            {history.map((ev, i) => (
              <HistoryRow key={`${ev.at}-${i}`} ev={ev} />
            ))}
          </ol>
        ) : (
          <p className="text-[12.5px] text-slate-400">No recorded history for this legacy record.</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
        <OutlineButton className="px-3 py-1.5 text-[12.5px]" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" /> Edit details
        </OutlineButton>
        <button
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete request
        </button>
      </div>
    </div>
  );
}

function TxExpanded({ tx }: { tx: TxRow }) {
  return (
    <tr className="border-b border-slate-50 bg-slate-50/70">
      <td />
      <td colSpan={7} className="px-4 pb-5">
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-100 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Reference" value={tx.reference} mono />
          <Detail label="Kind" value={tx.kind} />
          <Detail label="Method" value={tx.method} />
          <Detail label="Notes" value={tx.notes} />
        </div>
      </td>
    </tr>
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

/* ================= TRANSACTIONS ================= */

export function TransactionsPage({ ctx }: { ctx: AdminCtx }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [pageIdx, setPageIdx] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState<TxRow | null>(null);
  const [deleting, setDeleting] = useState<TxRow | null>(null);

  const filtered = useMemo(
    () =>
      ctx.state.txs.filter((t) => {
        const q = query.trim().toLowerCase();
        const matchQ =
          !q ||
          t.clientName.toLowerCase().includes(q) ||
          t.reference.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q) ||
          t.label.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q);
        const matchT = !type || t.type === type;
        const matchS = !status || t.status === status;
        return matchQ && matchT && matchS;
      }),
    [ctx.state.txs, query, type, status],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(pageIdx, pageCount - 1);
  const rows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const exportCsv = () => {
    downloadCsv("cryptowise-transactions.csv", [
      ["Date", "Reference", "Client", "Kind", "Type", "Amount USD", "Status", "Balance After", "Method", "Notes"],
      ...filtered.map((t) => [t.dateISO, t.reference, t.clientName, t.kind, t.type, t.amount.toFixed(2), t.status, t.balanceAfter.toFixed(2), t.method, t.notes]),
    ]);
    ctx.toast("Report exported", `${filtered.length} transactions exported to CSV.`);
  };

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="The ledger is the single source of truth — every edit updates balances, statistics and dashboards."
        right={
          <div className="flex items-center gap-2">
            <OutlineButton onClick={exportCsv}>
              <Download className="h-4 w-4" /> Export CSV
            </OutlineButton>
            <PrimaryButton onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4" /> New Transaction
            </PrimaryButton>
          </div>
        }
      />

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <SearchInput value={query} onChange={(v) => { setQuery(v); setPageIdx(0); }} placeholder="Search by client, reference, description, or notes..." />
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
            options={TX_STATUS_OPTIONS}
          />
        </div>
      </Card>

      <Card className="mt-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
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
                <Fragment key={t.id}>
                  <tr
                    className="cursor-pointer border-b border-slate-50 transition-colors hover:bg-slate-50/60"
                    onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                  >
                    <td className="px-4 py-4">
                      <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", expanded === t.id && "rotate-180")} />
                    </td>
                    <td className="px-2 py-4"><MonoId id={t.id} /></td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{t.dateISO}</td>
                    <td className="max-w-[280px] truncate px-4 py-4 font-semibold text-slate-900">{t.clientName}</td>
                    <td className={cn("px-4 py-4 text-[13px] font-semibold", t.type === "CREDIT" ? "text-emerald-500" : "text-amber-600")}>{t.type}</td>
                    <td className={cn("whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums", t.type === "CREDIT" ? "text-emerald-500" : "text-amber-600")} dir="ltr">
                      {t.type === "CREDIT" ? "+" : "-"}{usd(t.amount)}
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={t.status} /></td>
                    <td className="whitespace-nowrap px-6 py-4 text-right font-bold tabular-nums text-slate-900" dir="ltr">{usd(t.balanceAfter)}</td>
                  </tr>
                  {expanded === t.id && (
                    <tr className="border-b border-slate-50 bg-slate-50/70">
                      <td />
                      <td colSpan={7} className="px-4 pb-5">
                        <RequestManager tx={t} ctx={ctx} onEdit={() => setEditing(t)} onDelete={() => setDeleting(t)} />
                      </td>
                    </tr>
                  )}
                </Fragment>
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
      <EditTxModal tx={editing} onClose={() => setEditing(null)} ctx={ctx} />

      {/* delete confirmation */}
      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete Transaction">
        <p className="text-sm leading-relaxed text-slate-600">
          Delete the {deleting?.type === "CREDIT" ? "credit" : "debit"} of <span className="font-bold">{usd(deleting?.amount ?? 0)}</span> for{" "}
          <span className="font-semibold text-slate-900">{deleting?.clientName}</span>? The client&apos;s balance, all dashboard statistics, statements and reports will
          update immediately. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <OutlineButton onClick={() => setDeleting(null)}>Cancel</OutlineButton>
          <PrimaryButton
            className="!bg-amber-600 hover:!bg-amber-700"
            onClick={async () => {
              if (!deleting) return;
              const ok = await ctx.runAction({ action: "delete-transaction", id: deleting.id }, { title: "Transaction deleted", description: "Totals, balances and statistics were recalculated." });
              if (ok) setDeleting(null);
            }}
          >
            Delete Transaction
          </PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}

function NewTxModal({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: AdminCtx }) {
  const [clientId, setClientId] = useState("");
  const [type, setType] = useState<TxType>("CREDIT");
  const [kind, setKind] = useState<TxKind>("deposit");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<TxStatus>("COMPLETED");
  const [date, setDate] = useState(todayISO());
  const [method, setMethod] = useState("Bank Transfer");
  const [notes, setNotes] = useState("");

  const submit = async () => {
    const value = parseFloat(amount);
    if (!clientId) {
      ctx.toast("Select a client", "Choose which client this transaction belongs to.");
      return;
    }
    if (!value || value <= 0) {
      ctx.toast("Invalid amount", "Enter an amount greater than zero.");
      return;
    }
    const ok = await ctx.runAction(
      { action: "create-transaction", tx: { clientId, type, kind, amount: value, status, dateISO: date, method, notes } },
      { title: "Transaction created", description: `${type === "CREDIT" ? "Credit" : "Debit"} of $${value.toLocaleString("en-US")} recorded — all dashboards updated.` },
    );
    if (ok) {
      setClientId(""); setType("CREDIT"); setKind("deposit"); setAmount(""); setStatus("COMPLETED"); setDate(todayISO()); setMethod("Bank Transfer"); setNotes("");
      onClose();
    }
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
              onChange={(v) => {
                setType(v as TxType);
                setKind(v === "CREDIT" ? "deposit" : "withdrawal");
              }}
              options={[
                { value: "CREDIT", label: "Credit (money in)" },
                { value: "DEBIT", label: "Debit (money out)" },
              ]}
            />
          </div>
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Kind</span>
            <Select value={kind} onChange={(v) => setKind(v as TxKind)} options={KIND_OPTIONS} />
          </div>
          <TextInput label="Amount (USD) *" type="number" value={amount} onChange={setAmount} placeholder="0.00" />
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Status</span>
            <Select value={status} onChange={(v) => setStatus(v as TxStatus)} options={TX_STATUS_OPTIONS} />
          </div>
          <TextInput label="Date" type="date" value={date} onChange={setDate} />
          <TextInput label="Method" value={method} onChange={setMethod} />
        </div>
        <TextInput label="Notes" value={notes} onChange={setNotes} placeholder="Optional" />
        <div className="flex justify-end gap-3 pt-2">
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton onClick={submit}>Create Transaction</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

function EditTxModal({ tx, onClose, ctx }: { tx: TxRow | null; onClose: () => void; ctx: AdminCtx }) {
  const [dateISO, setDateISO] = useState("");
  const [kind, setKind] = useState<TxKind>("deposit");
  const [type, setType] = useState<TxType>("CREDIT");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<TxStatus>("COMPLETED");
  const [label, setLabel] = useState("");
  const [method, setMethod] = useState("");
  const [destination, setDestination] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [notes, setNotes] = useState("");
  const [loadedId, setLoadedId] = useState<string | null>(null);

  if (tx && loadedId !== tx.id) {
    setLoadedId(tx.id);
    setDateISO(tx.dateISO);
    setKind(tx.kind);
    setType(tx.type);
    setAmount(String(tx.amount));
    setStatus(tx.status);
    setLabel(tx.label);
    setMethod(tx.method);
    setDestination(tx.destination ?? "");
    setAdminNote(tx.adminNote ?? "");
    setNotes(tx.notes === "—" ? "" : tx.notes);
  }

  const close = () => {
    setLoadedId(null);
    onClose();
  };

  const save = async () => {
    if (!tx) return;
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value <= 0) {
      ctx.toast("Invalid amount", "Enter an amount greater than zero.");
      return;
    }
    const ok = await ctx.runAction(
      { action: "update-transaction", id: tx.id, patch: { dateISO, kind, type, amount: value, status, label, method, destination, adminNote, notes } },
      { title: "Request updated", description: "Every balance, statistic, statement and the client dashboard now reflect this change." },
    );
    if (ok) close();
  };

  return (
    <Modal open={!!tx} onClose={close} title="Edit Transaction" panelClassName="max-w-lg">
      {tx && (
        <div className="space-y-4">
          <p className="rounded-lg bg-slate-50 px-3.5 py-2.5 text-[12.5px] text-slate-500">
            {tx.clientName} · <span className="font-mono">{tx.reference}</span>
          </p>
          <div className="grid grid-cols-2 gap-4">
            <TextInput label="Date" type="date" value={dateISO} onChange={setDateISO} />
            <TextInput label="Amount (USD) *" type="number" value={amount} onChange={setAmount} />
            <div>
              <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Direction</span>
              <Select value={type} onChange={(v) => setType(v as TxType)} options={[{ value: "CREDIT", label: "Credit (money in)" }, { value: "DEBIT", label: "Debit (money out)" }]} />
            </div>
            <div>
              <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Kind</span>
              <Select value={kind} onChange={(v) => setKind(v as TxKind)} options={KIND_OPTIONS} />
            </div>
            <div>
              <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Status</span>
              <Select value={status} onChange={(v) => setStatus(v as TxStatus)} options={TX_STATUS_OPTIONS} />
            </div>
            <TextInput label="Method" value={method} onChange={setMethod} />
          </div>
          <TextInput label="Description" value={label} onChange={setLabel} />
          <TextInput label="Destination / Details" value={destination} onChange={setDestination} placeholder="Wallet address, bank account, target asset…" />
          <TextInput label="Internal Note (private)" value={adminNote} onChange={setAdminNote} placeholder="Never visible to the client" />
          <TextInput label="Client Note" value={notes} onChange={setNotes} placeholder="—" />
          <div className="flex justify-end gap-3 pt-2">
            <OutlineButton onClick={close}>Cancel</OutlineButton>
            <PrimaryButton onClick={save}>Save Changes</PrimaryButton>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ================= DEPOSITS ================= */

export function DepositsPage({ ctx }: { ctx: AdminCtx }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<TxRow | null>(null);
  const [deleting, setDeleting] = useState<TxRow | null>(null);

  const filtered = ctx.state.txs.filter((t) => {
    if (t.kind !== "deposit" && t.kind !== "opening") return false;
    const q = query.trim().toLowerCase();
    const matchQ = !q || t.clientName.toLowerCase().includes(q) || t.reference.toLowerCase().includes(q);
    const matchS = !status || t.status === status;
    return matchQ && matchS;
  });

  const total = filtered.filter((t) => t.status === "COMPLETED").reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <PageHeader title="Deposits" subtitle="Every credit received on the platform, including client deposit requests." />
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput value={query} onChange={setQuery} placeholder="Search by client or reference..." />
          <Select className="sm:w-44" value={status} onChange={setStatus} placeholder="All Statuses" options={TX_STATUS_OPTIONS} />
        </div>
      </Card>

      <Card className="mt-5">
        <div className="flex items-center justify-between px-6 py-4">
          <p className="text-[13px] text-slate-500">{filtered.length} deposits</p>
          <p className="text-sm font-bold text-emerald-600" dir="ltr">+{usd(total)} completed</p>
        </div>
        <div className="overflow-x-auto border-t border-slate-100">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[13px] font-medium text-slate-500">
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-4 py-4 font-medium">Client</th>
                <th className="px-4 py-4 font-medium">Reference</th>
                <th className="px-4 py-4 text-right font-medium">Amount</th>
                <th className="px-4 py-4 font-medium">Status</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-6 py-4 text-slate-600">{t.dateISO}</td>
                  <td className="max-w-[240px] truncate px-4 py-4 font-semibold text-slate-900">{t.clientName}</td>
                  <td className="px-4 py-4 font-mono text-[13px] text-slate-500">{t.reference}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums text-emerald-500" dir="ltr">+{usd(t.amount)}</td>
                  <td className="px-4 py-4"><StatusBadge status={t.status} /></td>
                  <td className="px-6 py-4 text-right"><TxActions tx={t} ctx={ctx} onEdit={() => setEditing(t)} onDelete={() => setDeleting(t)} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-sm text-slate-500">No deposits found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <EditTxModal tx={editing} onClose={() => setEditing(null)} ctx={ctx} />
      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete Transaction">
        <p className="text-sm leading-relaxed text-slate-600">
          Delete the deposit of <span className="font-bold">{usd(deleting?.amount ?? 0)}</span> for{" "}
          <span className="font-semibold text-slate-900">{deleting?.clientName}</span>? Balances, statistics and the client dashboard update immediately. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <OutlineButton onClick={() => setDeleting(null)}>Cancel</OutlineButton>
          <PrimaryButton
            className="!bg-amber-600 hover:!bg-amber-700"
            onClick={async () => {
              if (!deleting) return;
              const ok = await ctx.runAction({ action: "delete-transaction", id: deleting.id }, { title: "Transaction deleted", description: "Totals, balances and statistics were recalculated." });
              if (ok) setDeleting(null);
            }}
          >
            Delete Transaction
          </PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}

/* ================= WITHDRAWALS ================= */

const W_STATUSES: TxStatus[] = ["PENDING", "UNDER_REVIEW", "APPROVED", "PROCESSING", "COMPLETED", "REJECTED", "CANCELLED"];

export function WithdrawalsPage({ ctx }: { ctx: AdminCtx }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<TxRow | null>(null);

  const filtered = ctx.state.txs.filter((t) => {
    if (t.kind !== "withdrawal") return false;
    const q = query.trim().toLowerCase();
    const matchQ = !q || t.clientName.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q) || t.reference.toLowerCase().includes(q);
    const matchS = !status || t.status === status;
    return matchQ && matchS;
  });

  const pendingTotal = filtered.filter((t) => t.status === "PENDING" || t.status === "PROCESSING").reduce((s, t) => s + t.amount, 0);
  const editingW = editing ? filtered.find((w) => w.id === editing.id) ?? null : null;

  return (
    <div>
      <PageHeader title="Withdrawal Requests" subtitle="Approve or reject client withdrawals — approving debits the balance everywhere instantly." />

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput value={query} onChange={setQuery} placeholder="Search by client, reference, or destination..." />
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
        <div className="flex items-center justify-between px-6 py-4">
          <p className="text-[13px] text-slate-500">{filtered.filter((t) => t.status === "PENDING" || t.status === "PROCESSING").length} awaiting review</p>
          <p className="text-sm font-bold text-amber-600" dir="ltr">−{usd(pendingTotal)} pending</p>
        </div>
        <div className="overflow-x-auto border-t border-slate-100">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[13px] font-medium text-slate-500">
                <th className="w-10 px-4 py-4" />
                <th className="px-2 py-4 font-medium">Date</th>
                <th className="px-4 py-4 font-medium">Client</th>
                <th className="px-4 py-4 font-medium">Method</th>
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
                    <td className="whitespace-nowrap px-2 py-4 text-slate-600">{w.dateISO}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">{w.clientName}</td>
                    <td className="px-4 py-4 font-medium text-slate-700">{w.method}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-right font-mono text-[13px] tabular-nums text-slate-900" dir="ltr">−{usd(w.amount)}</td>
                    <td className="px-4 py-4"><StatusBadge status={w.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {(w.status === "PENDING" || w.status === "PROCESSING") && (
                          <>
                            <PrimaryButton className="px-3 py-1.5 text-[13px]" onClick={() => ctx.runAction({ action: "set-transaction-status", id: w.id, status: "COMPLETED" }, { title: "Withdrawal approved", description: `${usd(w.amount)} debited from ${w.clientName} — every dashboard updated.` })}>
                              <Check className="h-3.5 w-3.5" /> Approve
                            </PrimaryButton>
                            <OutlineButton className="px-3 py-1.5 text-[13px]" onClick={() => ctx.runAction({ action: "set-transaction-status", id: w.id, status: "REJECTED" }, { title: "Withdrawal rejected", description: `${w.clientName} will see the decision on their dashboard.` })}>
                              <X className="h-3.5 w-3.5" /> Reject
                            </OutlineButton>
                          </>
                        )}
                        <OutlineButton className="px-3 py-1.5 text-[13px]" onClick={() => setEditing(w)}>
                          <Pencil className="h-3.5 w-3.5" /> Update
                        </OutlineButton>
                      </div>
                    </td>
                  </tr>
                  {expanded === w.id && (
                    <tr className="border-b border-slate-50 bg-slate-50/70">
                      <td />
                      <td colSpan={6} className="px-4 pb-5">
                        <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-100 bg-white p-5 sm:grid-cols-2">
                          <Detail label="Reference" value={w.reference} mono />
                          <Detail label="Destination / Notes" value={w.notes} mono={w.notes.startsWith("0x") || w.notes.startsWith("bc1") || w.notes.startsWith("TQ")} />
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
        onSave={async (newStatus, note) => {
          if (!editingW) return;
          const ok = await ctx.runAction(
            { action: "set-transaction-status", id: editingW.id, status: newStatus, note: note || undefined },
            { title: `Withdrawal ${statusLabel(newStatus).toLowerCase()}`, description: `${editingW.clientName}'s request ${editingW.reference} → ${statusLabel(newStatus)} — balances recalculated and the client notified.` },
          );
          if (ok) setEditing(null);
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
  withdrawal: TxRow | null;
  onClose: () => void;
  onSave: (status: TxStatus, note: string) => void;
}) {
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");

  const close = () => {
    setStatus("");
    setNote("");
    onClose();
  };

  return (
    <Modal open={!!withdrawal} onClose={close} title="Update Withdrawal Request">
      {withdrawal && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {withdrawal.clientName} — <span dir="ltr">{usd(withdrawal.amount)}</span> · {withdrawal.method} · <span className="font-mono">{withdrawal.reference}</span>
          </p>
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-slate-600">New Status *</span>
            <Select
              value={status}
              onChange={setStatus}
              placeholder="Select new status"
              options={W_STATUSES.map((s) => ({ value: s, label: statusLabel(s) }))}
            />
          </div>
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-slate-600">Note for the client (visible on their dashboard)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional — sent to the client with the decision"
              rows={3}
              className="w-full resize-y rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <OutlineButton onClick={close}>Cancel</OutlineButton>
            <PrimaryButton
              disabled={!status}
              onClick={() => {
                onSave(status as TxStatus, note.trim());
                setStatus("");
                setNote("");
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

/* ================= BALANCES ================= */

export function BalancesPage({ ctx }: { ctx: AdminCtx }) {
  const [query, setQuery] = useState("");
  const [adjusting, setAdjusting] = useState<AdminCtx["state"]["clients"][number] | null>(null);

  const filtered = ctx.state.clients.filter((c) => {
    const q = query.trim().toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.accountNo.toLowerCase().includes(q);
  });
  const totalBalance = filtered.reduce((s, c) => s + c.financials.balance, 0);

  return (
    <div>
      <PageHeader title="Balances" subtitle="Live balances computed from the ledger — adjust the opening balance to correct an account." />

      <RatesCard ctx={ctx} />

      <Card className="mt-5 p-4">
        <SearchInput value={query} onChange={setQuery} placeholder="Search by name, email, or account no..." />
      </Card>

      <Card className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
          <p className="text-[13px] text-slate-500">{filtered.length} accounts</p>
          <p className="text-sm font-bold text-slate-900" dir="ltr">{usd(totalBalance)} total</p>
        </div>
        <div className="overflow-x-auto border-t border-slate-100">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[13px] font-medium text-slate-500">
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-4 py-4 text-right font-medium">Opening</th>
                <th className="px-4 py-4 text-right font-medium">Credits</th>
                <th className="px-4 py-4 text-right font-medium">Debits</th>
                <th className="px-4 py-4 text-right font-medium">Pending W/D</th>
                <th className="px-4 py-4 text-right font-medium">Current Balance</th>
                <th className="px-4 py-4 text-right font-medium">Available</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/60">
                  <td className="max-w-[260px] px-6 py-4">
                    <p className="truncate font-semibold text-slate-900">{c.name}</p>
                    <p className="truncate text-xs text-slate-500">{c.accountNo}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums text-slate-600" dir="ltr">{usd(c.openingBalance)}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums text-emerald-600" dir="ltr">{usd(c.financials.credits)}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums text-amber-600" dir="ltr">{usd(c.financials.debits)}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums text-slate-500" dir="ltr">{usd(c.financials.pendingWithdrawals)}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-right font-bold tabular-nums text-slate-900" dir="ltr">{usd(c.financials.balance)}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums text-slate-700" dir="ltr">{usd(c.financials.available)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <OutlineButton className="px-3 py-1.5 text-[13px]" onClick={() => setAdjusting(c)}>
                      <Pencil className="h-3.5 w-3.5" /> Adjust
                    </OutlineButton>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center text-sm text-slate-500">No accounts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AdjustBalanceModal client={adjusting} onClose={() => setAdjusting(null)} ctx={ctx} />
    </div>
  );
}

/* Currency reference rates — the ONE source for the client display-currency
   formatter. USD is the ledger base (locked to 1); the other rates are
   admin-managed indicative values. */
function RatesCard({ ctx }: { ctx: AdminCtx }) {
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const fx = ctx.state.fx;
  const dirty =
    draft &&
    CURRENCY_CODES.some((code) => code !== "USD" && parseFloat(draft[code]) !== fx[code]);
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Currency Reference Rates</h2>
          <p className="mt-0.5 text-[13px] text-slate-500">
            Indicative USD-based rates used by the client dashboard display-currency selector. The ledger base (USD) is locked to 1.
          </p>
        </div>
        {dirty && (
          <div className="flex gap-2">
            <OutlineButton onClick={() => setDraft(null)}>Reset</OutlineButton>
            <PrimaryButton
              onClick={async () => {
                if (!draft) return;
                const rates: Record<string, number> = {};
                for (const code of CURRENCY_CODES) rates[code] = parseFloat(draft[code]) || 1;
                const ok = await ctx.runAction({ action: "set-rates", rates }, { title: "Rates updated", description: "Client dashboards now convert with the new reference rates." });
                if (ok) setDraft(null);
              }}
            >
              Save Rates
            </PrimaryButton>
          </div>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {CURRENCY_CODES.map((code) => (
          <label key={code} className="block">
            <span className="mb-1 block text-[12px] font-semibold text-slate-500">{code}</span>
            <input
              type="number"
              step="any"
              min="0"
              disabled={code === "USD"}
              value={draft?.[code] ?? String(fx[code] ?? 1)}
              onChange={(e) => setDraft({ ...(draft ?? Object.fromEntries(CURRENCY_CODES.map((c) => [c, String(fx[c] ?? 1)]))), [code]: e.target.value })}
              dir="ltr"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </label>
        ))}
      </div>
    </Card>
  );
}

function AdjustBalanceModal({ client, onClose, ctx }: { client: AdminCtx["state"]["clients"][number] | null; onClose: () => void; ctx: AdminCtx }) {
  const [value, setValue] = useState("");

  return (
    <Modal open={!!client} onClose={onClose} title="Adjust Opening Balance">
      {client && (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-600">
            The current balance is <span className="font-bold text-slate-900">{usd(client.financials.balance)}</span> — always calculated from the ledger. Set a new
            opening balance to carry-in funds; every dashboard and statistic updates instantly.
          </p>
          <TextInput label="Opening Balance (USD)" type="number" value={value} onChange={setValue} placeholder={String(client.openingBalance)} />
          <div className="flex justify-end gap-3 pt-2">
            <OutlineButton onClick={onClose}>Cancel</OutlineButton>
            <PrimaryButton
              onClick={async () => {
                const ok = await ctx.runAction(
                  { action: "update-client", id: client.id, patch: { openingBalance: parseFloat(value) || 0 } },
                  { title: "Balance adjusted", description: `${client.name}'s opening balance is now ${usd(parseFloat(value) || 0)}.` },
                );
                if (ok) {
                  setValue("");
                  onClose();
                }
              }}
            >
              Save Balance
            </PrimaryButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
