"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Mail,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import type { AuditAction } from "@/lib/shared-types";
import type { AdminCtx } from "./types";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Card,
  Modal,
  OutlineButton,
  PageHeader,
  PrimaryButton,
  Select,
  StatusBadge,
  TextInput,
} from "./ui";
import { cn } from "@/lib/utils";

/* ================= AUDIT TRAIL ================= */

const PAGE_SIZE = 10;

const ACTIONS: AuditAction[] = [
  "Create Transaction",
  "Update Transaction",
  "Delete Transaction",
  "Create Client",
  "Update Client",
  "Delete Client",
  "Update Withdrawal",
  "Create Withdrawal",
  "Create Staff",
  "Update Staff",
  "Create Role",
  "Update Role",
  "Sign In",
  "Send Notification",
  "Change Password",
];

export function AuditPage({ ctx }: { ctx: AdminCtx }) {
  const [action, setAction] = useState("");
  const [pageIdx, setPageIdx] = useState(0);

  const filtered = useMemo(
    () => ctx.state.audit.filter((a) => !action || a.action === action),
    [ctx.state.audit, action],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(pageIdx, pageCount - 1);
  const rows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Audit Trail"
        subtitle="Track all administrative actions and system events."
        right={
          <Select
            className="w-48"
            value={action}
            onChange={(v) => { setAction(v); setPageIdx(0); }}
            placeholder="Filter by action"
            options={ACTIONS.map((a) => ({ value: a, label: a }))}
          />
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[0.8125rem] font-medium text-slate-500">
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-4 py-4 font-medium">Admin</th>
                <th className="px-4 py-4 font-medium">Action</th>
                <th className="px-4 py-4 font-medium">Entity</th>
                <th className="px-4 py-4 font-medium">Details</th>
                <th className="px-6 py-4 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-6 py-4 text-slate-600">{a.date}</td>
                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">{a.admin}</td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-[0.8125rem] font-medium text-slate-700">
                      {a.action}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-[0.8125rem] font-medium tracking-wide text-slate-600">{a.entity}</td>
                  <td className="max-w-[420px] px-4 py-3">
                    {a.detailsOld && (
                      <p className="truncate font-mono text-xs text-amber-600" title={a.detailsOld}>{a.detailsOld}</p>
                    )}
                    <p className="truncate font-mono text-xs text-emerald-600" title={a.detailsNew}>{a.detailsNew}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{a.ip}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-sm text-slate-500">No audit entries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
          <p className="text-[0.8125rem] text-slate-500">
            Showing 1–{rows.length} of {filtered.length} entries
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              disabled={safePage === 0}
              onClick={() => setPageIdx((p) => Math.max(0, p - 1))}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[0.8125rem] font-medium text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                onClick={() => setPageIdx(i)}
                className={cn(
                  "h-9 w-9 rounded-lg text-[0.8125rem] font-semibold transition-colors",
                  i === safePage ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100",
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={safePage >= pageCount - 1}
              onClick={() => setPageIdx((p) => Math.min(pageCount - 1, p + 1))}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[0.8125rem] font-medium text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ================= NOTIFICATIONS ================= */

export function NotificationsPage({ ctx }: { ctx: AdminCtx }) {
  const { notifications } = ctx.state;
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Client registrations, requests and platform events — synced live from the database."
        right={
          unread > 0 ? (
            <OutlineButton onClick={() => ctx.runAction({ action: "mark-all-read" }, { title: "All notifications marked as read" })}>
              <Eye className="h-4 w-4" /> Mark all as read
            </OutlineButton>
          ) : undefined
        }
      />

      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={cn(
              "rounded-xl border p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors",
              n.unread ? "border-emerald-200/60 bg-emerald-50/50 hover:bg-emerald-50" : "border-slate-200/80 bg-white hover:bg-slate-50/60",
            )}
          >
            <div className="flex items-start gap-3.5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
                <Info className="h-4 w-4 text-slate-500" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">{n.title}</p>
                  {n.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />}
                </div>
                <p className="mt-0.5 text-[0.8125rem] text-slate-500">{n.body}</p>
                {/* account-request notifications are wired to the real request —
                    jump straight to the review queue */}
                {n.requestId && n.audience === "admin" && (
                  <button
                    onClick={() => {
                      if (n.unread) void ctx.runAction({ action: "mark-read", id: n.id });
                      ctx.navigate("requests");
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[0.8125rem] font-bold text-white transition-colors hover:bg-emerald-700"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Review request
                  </button>
                )}
              </div>
              <span className="shrink-0 text-xs text-slate-400">{n.time}</span>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <Card className="p-12 text-center text-sm text-slate-500">No notifications.</Card>
        )}
      </div>
    </div>
  );
}

/* ================= STAFF & ROLES ================= */

export function StaffPage({ ctx }: { ctx: AdminCtx }) {
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Agent");

  const add = async () => {
    if (!name.trim() || !email.trim()) {
      ctx.toast("Missing information", "Name and email are required.");
      return;
    }
    if (password.length < 6) {
      ctx.toast("Weak password", "The staff password must be at least 6 characters.");
      return;
    }
    const ok = await ctx.runAction({ action: "add-staff", name: name.trim(), email: email.trim(), password, role }, { title: "Staff added", description: `${email.trim()} was created with a staff password.` });
    if (ok) {
      setName("");
      setEmail("");
      setPassword("");
      setRole("Agent");
      setAddOpen(false);
    }
  };

  return (
    <div>
      <PageHeader title="Staff & Roles" subtitle="Manage who can access the admin panel and exactly what they can do." />

      {/* Staff */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Staff</h2>
            <p className="mt-0.5 text-sm text-slate-500">Accounts with admin panel access.</p>
          </div>
          <PrimaryButton onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add Staff
          </PrimaryButton>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[0.8125rem] font-medium text-slate-500">
                <th className="py-3 pr-4 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last Login</th>
                <th className="py-3 pl-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ctx.state.staff.map((m) => (
                <tr key={m.id} className="border-b border-slate-50 last:border-0">
                  <td className="max-w-[220px] truncate py-4 pr-4 font-semibold text-slate-900">
                    {m.name} {m.you && <span className="font-normal text-slate-400">(you)</span>}
                  </td>
                  <td className="px-4 py-4 text-slate-600">{m.email}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
                      <ShieldCheck className="h-3.5 w-3.5" /> {m.role}
                    </span>
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={m.status} /></td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{m.lastLogin}</td>
                  <td className="py-4 pl-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        aria-label="Edit staff member"
                        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        aria-label="Remove staff member"
                        disabled={m.you}
                        onClick={() => ctx.runAction({ action: "remove-staff", id: m.id }, { title: "Staff removed", description: "The account no longer has admin access." })}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Roles */}
      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-1 h-5 w-5 text-slate-500" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Roles</h2>
              <p className="mt-0.5 text-sm text-slate-500">Define what each role can access. Staff &amp; role management always requires Super Admin.</p>
            </div>
          </div>
          <OutlineButton>
            <Plus className="h-4 w-4" /> New Role
          </OutlineButton>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[0.8125rem] font-medium text-slate-500">
                <th className="py-3 pr-4 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Permissions</th>
                <th className="px-4 py-3 font-medium">Staff</th>
                <th className="py-3 pl-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ctx.state.roles.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 last:border-0">
                  <td className="whitespace-nowrap py-4 pr-4 font-semibold text-slate-900">
                    {r.allAccess ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
                        <ShieldCheck className="h-3.5 w-3.5" /> {r.name}
                      </span>
                    ) : (
                      r.name
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {r.allAccess ? (
                      <span className="text-slate-500">All access</span>
                    ) : (
                      <div className="flex max-w-[560px] flex-wrap gap-1.5">
                        {r.permissions.map((p, i) => (
                          <span key={i} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-600">{r.staffCount}</td>
                  <td className="py-4 pl-4 text-right">
                    {!r.allAccess && (
                      <div className="inline-flex items-center gap-1">
                        <button aria-label="Edit role" className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button aria-label="Delete role" className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Staff">
        <div className="space-y-4">
          <TextInput label="Full Name *" value={name} onChange={setName} placeholder="Staff member name" />
          <TextInput label="Email *" type="email" value={email} onChange={setEmail} placeholder="staff@cryptowiseuk.com" />
          <div>
            <span className="mb-1.5 block text-[0.8125rem] font-medium text-slate-600">Password *</span>
            <PasswordInput theme="light" value={password} onChange={setPassword} placeholder="Staff sign-in password (min. 6 chars)" autoComplete="new-password" />
          </div>
          <div>
            <span className="mb-1.5 block text-[0.8125rem] font-medium text-slate-600">Role *</span>
            <Select value={role} onChange={setRole} options={ctx.state.roles.map((r) => ({ value: r.name, label: r.name }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <OutlineButton onClick={() => setAddOpen(false)}>Cancel</OutlineButton>
            <PrimaryButton onClick={add}>Add Staff</PrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ================= ADMIN PROFILE ================= */

export function ProfilePage({ ctx }: { ctx: AdminCtx }) {
  const [name, setName] = useState("Super Admin");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const updatePassword = async () => {
    if (!next || next.length < 8) {
      ctx.toast("Weak password", "New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      ctx.toast("Passwords do not match", "Re-enter the confirmation correctly.");
      return;
    }
    setBusy(true);
    const ok = await ctx.runAction({ action: "change-admin-password", current, next }, { title: "Password updated", description: "Your admin password was changed successfully." });
    setBusy(false);
    if (ok) {
      setCurrent("");
      setNext("");
      setConfirm("");
    }
  };

  return (
    <div>
      <PageHeader title="Admin Profile" subtitle="Manage your administrator account" />

      {/* Personal information */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
        <div className="mt-6 flex items-center gap-4 border-b border-slate-100 pb-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">SA</span>
          <div>
            <p className="text-[0.9375rem] font-bold text-slate-900">Super Admin</p>
            <p className="text-sm text-slate-500">Super Admin</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <TextInput label="Name" value={name} onChange={setName} />
          <TextInput label="Email" value="admin@cryptowiseuk.com" disabled />
          <div>
            <span className="mb-1.5 block text-[0.8125rem] font-medium text-slate-600">Role</span>
            <div className="flex h-11 w-full cursor-not-allowed items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3.5 text-sm text-slate-500">
              <ShieldCheck className="h-4 w-4 text-slate-400" /> Super Admin
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-[0.8125rem] font-medium text-slate-600">Status</span>
            <div className="flex h-11 w-full cursor-not-allowed items-center gap-2 rounded-lg border border-emerald-200/70 bg-emerald-50/60 px-3.5 text-sm font-medium text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Active
            </div>
          </div>
        </div>
        <PrimaryButton
          className="mt-6"
          onClick={() => ctx.toast("Changes saved", "Your profile has been updated.")}
        >
          Save Changes
        </PrimaryButton>
      </Card>

      {/* Account activity */}
      <Card className="mt-6 p-6">
        <h2 className="text-lg font-bold text-slate-900">Account Activity</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ActivityBox icon={<Mail className="h-4 w-4 text-slate-400" />} label="Email" value="admin@cryptowiseuk.com" />
          <ActivityBox icon={<CalendarDays className="h-4 w-4 text-slate-400" />} label="Account Created" value="Sep 4, 2026" />
          <ActivityBox icon={<Clock className="h-4 w-4 text-slate-400" />} label="Last Login" value="Sep 15, 2026, 07:41 AM" />
          <ActivityBox icon={<ShieldCheck className="h-4 w-4 text-slate-400" />} label="Role" value="Super Admin" />
        </div>
      </Card>

      {/* Change password */}
      <Card className="mt-6 p-6">
        <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
        <div className="mt-5 max-w-xl space-y-4">
          <PasswordInput theme="light" value={current} onChange={setCurrent} placeholder="Enter current password" autoComplete="current-password" />
          <PasswordInput theme="light" value={next} onChange={setNext} placeholder="Enter new password" autoComplete="new-password" />
          <PasswordInput theme="light" value={confirm} onChange={setConfirm} placeholder="Confirm new password" autoComplete="new-password" />
          <OutlineButton onClick={updatePassword} disabled={busy}>Update Password</OutlineButton>
        </div>
      </Card>
    </div>
  );
}

function ActivityBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3.5 rounded-lg border border-slate-200/80 p-4">
      {icon}
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
