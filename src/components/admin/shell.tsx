"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  BarChart3,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleUser,
  ClipboardList,
  LayoutGrid,
  LogOut,
  Menu,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/site/icons";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AUDIT_ENTRIES,
  CLIENTS,
  NOTIFICATIONS,
  ROLES,
  STAFF,
  TRANSACTIONS,
  WITHDRAWALS,
} from "@/lib/admin-data";
import type { AdminPage, AdminState, AdminCtx } from "./types";
import { DashboardPage, FinancialPage, MarketPage } from "./dashboard";
import { ClientDetailPage, ClientsPage } from "./clients";
import { TransactionsPage, WithdrawalsPage } from "./ledger";
import { AuditPage, NotificationsPage, ProfilePage, StaffPage } from "./misc";

const NAV: { page: AdminPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { page: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { page: "clients", label: "Clients", icon: Users },
  { page: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { page: "withdrawals", label: "Withdrawals", icon: ArrowDownToLine },
  { page: "financial", label: "Financial Overview", icon: TrendingUp },
  { page: "market", label: "Market Overview", icon: BarChart3 },
  { page: "audit", label: "Audit Logs", icon: ClipboardList },
  { page: "notifications", label: "Notifications", icon: Bell },
  { page: "staff", label: "Staff", icon: ShieldCheck },
];

function nowStamp(): string {
  const d = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}, ${String(h).padStart(2, "0")}:${min} ${ampm}`;
}

let auditSeq = 100;
function makeAuditId(): string {
  auditSeq += 1;
  return `a${auditSeq}`;
}

let txSeq = 1000;
function makeTxId(): string {
  txSeq += 1;
  return `cmu${txSeq.toString(36)}new${Math.random().toString(36).slice(2, 8)}`;
}

export function Backoffice({ onSignOut }: { onSignOut: () => void }) {
  const { toast } = useToast();
  const [page, setPage] = useState<AdminPage>("dashboard");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [state, setState] = useState<AdminState>({
    clients: CLIENTS,
    transactions: TRANSACTIONS,
    withdrawals: WITHDRAWALS,
    audit: AUDIT_ENTRIES,
    notifications: NOTIFICATIONS,
    staff: STAFF,
    roles: ROLES,
    comments: {},
  });

  const toastFn = useCallback(
    (title: string, description?: string) => toast({ title, description }),
    [toast],
  );

  const navigate = useCallback((p: AdminPage, clientId?: string) => {
    setPage(p);
    if (clientId !== undefined) setSelectedClientId(clientId);
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }, []);

  const unreadCount = useMemo(() => state.notifications.filter((n) => n.unread).length, [state.notifications]);

  const ctx: AdminCtx = useMemo(
    () => ({
      state,
      page,
      selectedClientId,
      unreadCount,
      navigate,
      toast: toastFn,
      addClient: ({ name, email, phone, country, balance }) => {
        const id = `cnew${Math.random().toString(36).slice(2, 12)}`;
        setState((s) => ({
          ...s,
          clients: [
            {
              id,
              name,
              email,
              phone: phone || "—",
              country: country || "—",
              balance,
              status: "ACTIVE",
              transactions: balance > 0 ? 1 : 0,
              agent: "Super Admin",
              credits: balance,
              debits: 0,
              joinedDaysAgo: 0,
            },
            ...s.clients,
          ],
          notifications: [
            {
              id: `n${Math.random().toString(36).slice(2, 8)}`,
              title: "New Client Registration",
              body: `${name} has registered on the platform.`,
              time: "just now",
              unread: true,
              kind: "registration" as const,
            },
            ...s.notifications,
          ],
          audit: [
            {
              id: makeAuditId(),
              date: nowStamp(),
              admin: "Super Admin",
              action: "Create Client" as const,
              entity: "USER" as const,
              detailsNew: JSON.stringify({ email, name, country: country || "—" }),
              ip: "—",
            },
            ...s.audit,
          ],
        }));
        toastFn("Client created", `${name} was added to the platform.`);
      },
      updateClient: (id, patch) => {
        setState((s) => ({
          ...s,
          clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
          audit: [
            {
              id: makeAuditId(),
              date: nowStamp(),
              admin: "Super Admin",
              action: "Update Client" as const,
              entity: "USER" as const,
              detailsNew: JSON.stringify(patch),
              ip: "—",
            },
            ...s.audit,
          ],
        }));
        toastFn("Changes saved", "Client details were updated.");
      },
      createTransaction: ({ clientId, type, amount, method, notes }) => {
        setState((s) => {
          const client = s.clients.find((c) => c.id === clientId);
          if (!client) return s;
          const balanceAfter =
            type === "CREDIT" ? client.balance + amount : Math.max(0, client.balance - amount);
          const tx = {
            id: makeTxId(),
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            dateISO: new Date().toISOString().slice(0, 10),
            clientId,
            clientName: client.name,
            type,
            amount,
            status: "COMPLETED" as const,
            balanceAfter,
            reference: `TXN-${Date.now().toString().slice(-8)}`,
            method,
            notes: notes || "—",
          };
          return {
            ...s,
            transactions: [tx, ...s.transactions],
            clients: s.clients.map((c) =>
              c.id === clientId
                ? {
                    ...c,
                    balance: balanceAfter,
                    transactions: c.transactions + 1,
                    credits: type === "CREDIT" ? c.credits + amount : c.credits,
                    debits: type === "DEBIT" ? c.debits + amount : c.debits,
                  }
                : c,
            ),
            audit: [
              {
                id: makeAuditId(),
                date: nowStamp(),
                admin: "Super Admin",
                action: "Create Transaction" as const,
                entity: "TRANSACTION" as const,
                detailsNew: JSON.stringify({ clientId, type, amount, reference: tx.reference }),
                ip: "—",
              },
              ...s.audit,
            ],
          };
        });
        toastFn("Transaction created", `${type === "CREDIT" ? "Credit" : "Debit"} of $${amount.toLocaleString("en-US")} recorded.`);
      },
      updateWithdrawal: (id, status, notes) => {
        setState((s) => {
          const w = s.withdrawals.find((x) => x.id === id);
          return {
            ...s,
            withdrawals: s.withdrawals.map((x) => (x.id === id ? { ...x, status, notes } : x)),
            audit: [
              {
                id: makeAuditId(),
                date: nowStamp(),
                admin: "Super Admin",
                action: "Update Withdrawal" as const,
                entity: "WITHDRAWAL" as const,
                detailsOld: w ? JSON.stringify({ status: w.status }) : undefined,
                detailsNew: JSON.stringify({ status, ...(notes ? { notes } : {}) }),
                ip: "—",
              },
              ...s.audit,
            ],
          };
        });
        toastFn("Withdrawal updated", `Status changed to ${status.toLowerCase()}.`);
      },
      addComment: (clientId, body) => {
        setState((s) => ({
          ...s,
          comments: {
            ...s.comments,
            [clientId]: [
              ...(s.comments[clientId] ?? []),
              { id: `cm${Math.random().toString(36).slice(2, 8)}`, author: "Super Admin", time: "just now", body },
            ],
          },
        }));
        toastFn("Comment posted");
      },
      markRead: (id) => {
        setState((s) => ({
          ...s,
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, unread: false } : n)),
        }));
      },
      markAllRead: () => {
        setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, unread: false })) }));
        toastFn("All notifications marked as read");
      },
      addStaff: (name, email, role) => {
        setState((s) => ({
          ...s,
          staff: [...s.staff, { id: `st${Math.random().toString(36).slice(2, 8)}`, name, email, role, status: "ACTIVE" as const, lastLogin: "—" }],
          audit: [
            {
              id: makeAuditId(),
              date: nowStamp(),
              admin: "Super Admin",
              action: "Update Staff" as const,
              entity: "STAFF" as const,
              detailsNew: JSON.stringify({ email, role, status: "ACTIVE" }),
              ip: "—",
            },
            ...s.audit,
          ],
        }));
        toastFn("Staff added", `${email} can now access the admin panel.`);
      },
      removeStaff: (id) => {
        setState((s) => ({ ...s, staff: s.staff.filter((m) => m.id !== id) }));
        toastFn("Staff removed", "The account no longer has admin access.");
      },
    }),
    [state, page, selectedClientId, unreadCount, navigate, toastFn],
  );

  const signOut = useCallback(() => {
    onSignOut();
  }, [onSignOut]);

  const sidebarNode = (mobile = false) => (
    <div className={cn("flex h-full flex-col bg-[#0d1a2b]", collapsed && !mobile ? "w-[78px]" : "w-[264px]")}>
      {/* Brand */}
      <div className={cn("flex h-[72px] shrink-0 items-center gap-3 border-b border-white/[0.06]", collapsed && !mobile ? "justify-center px-2" : "px-5")}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/10">
          <LogoMark className="h-6 w-6 text-[#00E5A0]" />
        </div>
        {!collapsed || mobile ? (
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold leading-tight text-white">Global Exchange</p>
            <p className="truncate text-xs text-slate-400">Administration</p>
          </div>
        ) : null}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          const active = page === item.page || (page === "client-detail" && item.page === "clients");
          const Icon = item.icon;
          return (
            <button
              key={item.page}
              onClick={() => navigate(item.page)}
              title={collapsed && !mobile ? item.label : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-white/[0.07] text-emerald-400" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {(!collapsed || mobile) && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}

        {(!collapsed || mobile) && (
          <div className="mt-4 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] p-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </span>
              <p className="text-sm font-semibold text-white">Platform Integrity</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              All admin actions are logged and access-controlled. Every change is traceable in the audit log.
            </p>
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className="shrink-0 border-t border-white/[0.06] px-3 py-3">
        <button
          onClick={() => navigate("profile")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-200",
            page === "profile" && "bg-white/[0.07] text-emerald-400",
          )}
        >
          <CircleUser className="h-[18px] w-[18px] shrink-0" />
          {(!collapsed || mobile) && "Profile"}
        </button>
        <div className="my-2 border-t border-white/[0.06]" />
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-200"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {(!collapsed || mobile) && "Sign Out"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 [color-scheme:light]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        {sidebarNode(false)}
        {/* Collapse handle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:text-slate-800"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 shadow-2xl">
            <div className="relative h-full">
              {sidebarNode(true)}
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="absolute -right-11 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main column */}
      <div className={cn("flex min-h-screen flex-col transition-[padding] duration-200", collapsed ? "lg:pl-[78px]" : "lg:pl-[264px]")}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between bg-[#f8fafc]/90 px-4 backdrop-blur sm:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-2.5">
            {/* Notifications bell */}
            <button
              onClick={() => navigate("notifications")}
              aria-label="Notifications"
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:text-slate-900"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Account card */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-4 shadow-sm transition-colors hover:bg-slate-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">S</span>
                <span className="text-left leading-tight">
                  <span className="block text-sm font-bold text-slate-900">Administrator</span>
                  <span className="block text-xs text-slate-500">Super Admin</span>
                </span>
                <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", menuOpen && "rotate-180")} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("profile");
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <CircleUser className="h-4 w-4 text-slate-400" /> Profile
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        signOut();
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <LogOut className="h-4 w-4 text-slate-400" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 pb-16 sm:px-8">
          {page === "dashboard" && <DashboardPage ctx={ctx} />}
          {page === "clients" && <ClientsPage ctx={ctx} />}
          {page === "client-detail" && <ClientDetailPage ctx={ctx} />}
          {page === "transactions" && <TransactionsPage ctx={ctx} />}
          {page === "withdrawals" && <WithdrawalsPage ctx={ctx} />}
          {page === "financial" && <FinancialPage ctx={ctx} />}
          {page === "market" && <MarketPage ctx={ctx} />}
          {page === "audit" && <AuditPage ctx={ctx} />}
          {page === "notifications" && <NotificationsPage ctx={ctx} />}
          {page === "staff" && <StaffPage ctx={ctx} />}
          {page === "profile" && <ProfilePage ctx={ctx} />}
        </main>
      </div>
    </div>
  );
}
