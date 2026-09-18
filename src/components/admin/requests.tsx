"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  Eye,
  Globe,
  Phone,
  UserPlus,
  X,
} from "lucide-react";
import type { PublicAccountRequest } from "@/lib/shared-types";
import type { AdminCtx } from "./types";
import { Card, Modal, PageHeader, PrimaryButton, OutlineButton, StatusBadge } from "./ui";
import { cn } from "@/lib/utils";

/* ================================================================== */
/*  ACCOUNT REQUESTS — the public registration queue (#44 workflow).   */
/*  Every public sign-up lands here as PENDING. Only Super Admin can   */
/*  APPROVE (provisions the client account with the chosen credentials) */
/*  or REJECT (stays inactive). The list, the notification bell, the   */
/*  audit trail and the Clients tab all read the SAME server records.  */
/* ================================================================== */

type Filter = "pending" | "approved" | "rejected" | "all";

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function relTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function RequestsPage({ ctx }: { ctx: AdminCtx }) {
  const { accountRequests } = ctx.state;
  const [filter, setFilter] = useState<Filter>("pending");
  const [details, setDetails] = useState<PublicAccountRequest | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      pending: accountRequests.filter((r) => r.status === "pending").length,
      approved: accountRequests.filter((r) => r.status === "approved").length,
      rejected: accountRequests.filter((r) => r.status === "rejected").length,
      all: accountRequests.length,
    }),
    [accountRequests],
  );

  const visible = useMemo(
    () => (filter === "all" ? accountRequests : accountRequests.filter((r) => r.status === filter)),
    [accountRequests, filter],
  );

  const decide = async (id: string, decision: "approve" | "reject") => {
    setBusyId(id);
    const ok = await ctx.runAction(
      decision === "approve" ? { action: "approve-request", id } : { action: "reject-request", id },
      decision === "approve"
        ? { title: "Account request approved", description: "The client account is now active and can sign in." }
        : { title: "Account request rejected", description: "No client account was created — the request stays inactive." },
    );
    setBusyId(null);
    if (ok) setDetails(null);
  };

  return (
    <div>
      <PageHeader
        title="Account Requests"
        subtitle="New account requests submitted from the public registration form — approve to activate the client account, reject to keep it inactive."
      />

      {/* status filter pills — pending first, live counts from the snapshot */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["pending", "Pending"],
            ["approved", "Approved"],
            ["rejected", "Rejected"],
            ["all", "All"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
              filter === key
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            {label}
            <span
              className={cn(
                "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[0.625rem] font-bold",
                filter === key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
              )}
            >
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* request cards */}
      <div className="mt-5 space-y-3">
        {visible.map((r) => (
          <Card key={r.id} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="text-[0.9375rem] font-bold text-slate-900">{r.name}</p>
                  <StatusBadge status={r.status.toUpperCase()} />
                </div>
                <p className="mt-0.5 break-all text-sm text-slate-500" dir="ltr">
                  {r.email}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-slate-500">
                  {r.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" /> <span dir="ltr">{r.phone}</span>
                    </span>
                  )}
                  {r.country && (
                    <span className="inline-flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-slate-400" /> {r.country}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5 text-slate-400" /> {fmtDateTime(r.createdAtISO)} · {relTime(r.createdAtISO)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <OutlineButton onClick={() => setDetails(r)} className="px-3 py-2">
                  <Eye className="h-4 w-4" /> View Details
                </OutlineButton>
                {r.status === "pending" && (
                  <>
                    <PrimaryButton
                      onClick={() => decide(r.id, "approve")}
                      disabled={busyId === r.id}
                      className="px-3 py-2"
                    >
                      <Check className="h-4 w-4" /> Approve
                    </PrimaryButton>
                    <button
                      onClick={() => decide(r.id, "reject")}
                      disabled={busyId === r.id}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X className="h-4 w-4" /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* decision trail */}
            {r.status !== "pending" && (
              <p className="mt-3 border-t border-slate-100 pt-2.5 text-[0.8125rem] text-slate-500">
                {r.status === "approved"
                  ? `Approved by ${r.reviewedBy ?? "Super Admin"}${r.reviewedAtISO ? ` · ${fmtDateTime(r.reviewedAtISO)}` : ""}${r.clientId ? " · linked client account is active" : ""}`
                  : `Rejected by ${r.reviewedBy ?? "Super Admin"}${r.reviewedAtISO ? ` · ${fmtDateTime(r.reviewedAtISO)}` : ""}${r.rejectReason ? ` · Reason: ${r.rejectReason}` : ""}`}
              </p>
            )}
          </Card>
        ))}

        {visible.length === 0 && (
          <Card className="p-12 text-center">
            <UserPlus className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-600">
              {filter === "pending" ? "No pending account requests." : "No account requests here yet."}
            </p>
            <p className="mt-1 text-[0.8125rem] text-slate-400">
              Requests submitted through “انشاء حساب جديد / Create New Account” on the homepage appear here instantly.
            </p>
          </Card>
        )}
      </div>

      {/* full request details */}
      <Modal open={details !== null} onClose={() => setDetails(null)} title="Registration Request Details" wide>
        {details && (
          <div>
            <div className="flex items-center gap-2.5">
              <StatusBadge status={details.status.toUpperCase()} />
              <span className="text-[0.8125rem] text-slate-500">Submitted {fmtDateTime(details.createdAtISO)}</span>
            </div>

            <dl className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
              {(
                [
                  ["Full Name", details.name],
                  ["Email", details.email, true],
                  ["Phone", details.phone || "—", true],
                  ["Country", details.country || "—"],
                  ["Address", details.address || "—"],
                  ["Registration date/time", fmtDateTime(details.createdAtISO)],
                  ["Request ID", details.id],
                ] as Array<[string, string, boolean?]>
              ).map(([label, value, ltr]) => (
                <div key={label} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <dt className="text-[0.8125rem] font-medium text-slate-500">{label}</dt>
                  <dd className={cn("max-w-[60%] break-words text-right text-sm font-semibold text-slate-900", ltr && "break-all")} dir={ltr ? "ltr" : undefined}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            {details.status !== "pending" && (
              <p className="mt-3 rounded-lg bg-slate-50 px-3.5 py-2.5 text-[0.8125rem] text-slate-600">
                {details.status === "approved"
                  ? "This request was approved — the client account is active and the user can sign in."
                  : "This request was rejected — no client account exists and the user cannot access the Client Dashboard."}
              </p>
            )}

            {details.status === "pending" && (
              <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5">
                <OutlineButton onClick={() => decide(details.id, "reject")} disabled={busyId === details.id}>
                  <X className="h-4 w-4" /> Reject
                </OutlineButton>
                <PrimaryButton onClick={() => decide(details.id, "approve")} disabled={busyId === details.id}>
                  <Check className="h-4 w-4" /> Approve
                </PrimaryButton>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
