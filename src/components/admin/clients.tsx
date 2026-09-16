"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  Eye,
  Inbox,
  MessageSquare,
  Pencil,
  Plus,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { usd } from "@/lib/admin-data";
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

/* ================= CLIENTS LIST ================= */

export function ClientsPage({ ctx }: { ctx: AdminCtx }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [pageIdx, setPageIdx] = useState(0);
  const [newOpen, setNewOpen] = useState(false);

  const filtered = useMemo(
    () =>
      ctx.state.clients.filter((c) => {
        const q = query.trim().toLowerCase();
        const matchQ =
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone || "").toLowerCase().includes(q);
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
        subtitle="Manage and view all registered clients."
        right={
          <PrimaryButton onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" /> New Client
          </PrimaryButton>
        }
      />

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput value={query} onChange={(v) => { setQuery(v); setPageIdx(0); }} placeholder="Search by name, email, or phone..." />
          <Select
            className="sm:w-44"
            value={status}
            onChange={(v) => { setStatus(v); setPageIdx(0); }}
            placeholder="All Statuses"
            options={[
              { value: "ACTIVE", label: "Active" },
              { value: "SUSPENDED", label: "Suspended" },
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
                  <td className="max-w-[300px] truncate px-6 py-4 font-semibold text-slate-900">{c.name}</td>
                  <td className="max-w-[240px] truncate px-4 py-4 text-slate-600">{c.email}</td>
                  <td className="px-4 py-4 text-slate-600">{c.country}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-right font-bold tabular-nums text-slate-900">{usd(c.balance)}</td>
                  <td className="px-4 py-4"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-4 text-slate-600">{c.transactions}</td>
                  <td className="px-4 py-4 text-slate-600">{c.agent}</td>
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
              Next <ArrowRight />
            </OutlineButton>
          </div>
        </div>
      </Card>

      <NewClientModal open={newOpen} onClose={() => setNewOpen(false)} ctx={ctx} />
    </div>
  );
}

function ArrowRight() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function NewClientModal({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: AdminCtx }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [balance, setBalance] = useState("0.00");

  const submit = () => {
    if (!name.trim() || !email.trim()) {
      ctx.toast("Missing information", "Name and email are required.");
      return;
    }
    ctx.addClient({ name: name.trim(), email: email.trim(), phone: phone.trim(), country: country.trim(), balance: parseFloat(balance) || 0 });
    setName(""); setEmail(""); setPhone(""); setCountry(""); setBalance("0.00");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New Client">
      <div className="space-y-4">
        <TextInput label="Full Name *" value={name} onChange={setName} placeholder="e.g. Charlie Williams" />
        <TextInput label="Email *" type="email" value={email} onChange={setEmail} placeholder="client@email.com" />
        <div className="grid grid-cols-2 gap-4">
          <TextInput label="Phone" value={phone} onChange={setPhone} placeholder="Optional" />
          <TextInput label="Country" value={country} onChange={setCountry} placeholder="Optional" />
        </div>
        <TextInput label="Opening Balance (USD)" type="number" value={balance} onChange={setBalance} />
        <div className="flex justify-end gap-3 pt-2">
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton onClick={submit}>Create Client</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

/* ================= CLIENT DETAIL ================= */

export function ClientDetailPage({ ctx }: { ctx: AdminCtx }) {
  const client = ctx.state.clients.find((c) => c.id === ctx.selectedClientId);
  const [form, setForm] = useState<Record<string, string> | null>(null);
  const [note, setNote] = useState("");

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
    phone: client.phone === "—" ? "" : client.phone,
    country: client.country === "—" ? "" : client.country,
    agent: client.agent === "—" ? "" : client.agent,
  };

  const set = (k: string, v: string) => setForm({ ...f, [k]: v });

  const save = () => {
    ctx.updateClient(client.id, {
      name: f.name.trim() || client.name,
      email: f.email.trim() || client.email,
      phone: f.phone.trim() || "—",
      country: f.country.trim() || "—",
      agent: f.agent.trim() || "—",
    });
    setForm(null);
  };

  const txs = ctx.state.transactions.filter((t) => t.clientId === client.id).slice(0, 5);
  const comments = ctx.state.comments[client.id] ?? [];

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
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900">{client.name}</h1>
            <p className="mt-0.5 text-sm text-slate-500">Client details and activity</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <OutlineButton onClick={() => { setForm(null); ctx.navigate("clients"); }}>
            <X className="h-4 w-4" /> Cancel
          </OutlineButton>
          <PrimaryButton onClick={save}>Save Changes</PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Personal information */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
          <div className="mt-6 space-y-5">
            <TextInput label="Name" value={f.name} onChange={(v) => set("name", v)} />
            <TextInput label="Email" type="email" value={f.email} onChange={(v) => set("email", v)} />
            <TextInput label="Phone" value={f.phone} onChange={(v) => set("phone", v)} />
            <TextInput label="Country" value={f.country} onChange={(v) => set("country", v)} />
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
        </Card>

        {/* Financial summary */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-900">Financial Summary</h2>
          <div className="mt-4 divide-y divide-slate-100">
            <SummaryRow icon={<Wallet className="h-4 w-4 text-slate-400" />} label="Balance" value={usd(client.balance)} valueClass="font-bold text-slate-900" />
            <SummaryRow icon={<ArrowUpCircle className="h-4 w-4 text-emerald-500" />} label="Total Credits" value={usd(client.credits)} valueClass="font-semibold text-emerald-500" />
            <SummaryRow icon={<ArrowDownCircle className="h-4 w-4 text-amber-600" />} label="Total Debits" value={usd(client.debits)} valueClass="font-semibold text-amber-600" />
            <SummaryRow icon={<TrendIcon />} label="Performance" value="+0.00%" valueClass="font-semibold text-emerald-500" />
            <div className="flex items-center justify-between py-4">
              <span className="text-sm text-slate-500">Total Transactions</span>
              <span className="text-sm font-bold text-slate-900">{client.transactions}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card className="mt-6">
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
          <button onClick={() => ctx.navigate("transactions")} className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
            View all
          </button>
        </div>
        <div className="mt-4 overflow-x-auto px-2 pb-4">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[13px] font-medium text-slate-500">
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Description</th>
                <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                <th className="px-4 py-2.5 text-right font-medium">Balance After</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id} className="border-b border-slate-50 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{t.date}{t.status === "PENDING" ? "" : ""}</td>
                  <td className={cn("px-4 py-3.5 text-[13px] font-semibold", t.type === "CREDIT" ? "text-emerald-500" : "text-amber-600")}>{t.type}</td>
                  <td className="max-w-[220px] truncate px-4 py-3.5 text-slate-500">{t.notes === "—" ? "—" : t.notes}</td>
                  <td className={cn("whitespace-nowrap px-4 py-3.5 text-right font-semibold tabular-nums", t.type === "CREDIT" ? "text-emerald-500" : "text-amber-600")}>
                    {t.type === "CREDIT" ? "+" : "-"}{usd(t.amount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right font-bold tabular-nums text-slate-900">{usd(t.balanceAfter)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={t.status} /></td>
                </tr>
              ))}
              {txs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">No transactions yet.</td>
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
            onClick={() => {
              if (!client) return;
              ctx.addComment(client.id, note.trim());
              setNote("");
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
