"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowDownUp,
  BarChart3,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleUser,
  ClipboardList,
  LayoutGrid,
  Loader2,
  LogOut,
  Menu,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/site/icons";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiAdminAction, apiAdminGet, apiLogout } from "@/lib/api";
import type { AdminAction } from "@/lib/shared-types";
import type { AdminPage, AdminState, AdminCtx } from "./types";
import { DashboardPage, FinancialPage, MarketPage } from "./dashboard";
import { ClientDetailPage, ClientsPage } from "./clients";
import { BalancesPage, DepositsPage, TransactionsPage, WithdrawalsPage } from "./ledger";
import { AuditPage, NotificationsPage, ProfilePage, StaffPage } from "./misc";
import { RequestsPage } from "./requests";

const NAV: { page: AdminPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { page: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { page: "clients", label: "Clients", icon: Users },
  { page: "requests", label: "Account Requests", icon: UserPlus },
  { page: "transactions", label: "Transactions", icon: ArrowDownUp },
  { page: "deposits", label: "Deposits", icon: Wallet },
  { page: "withdrawals", label: "Withdrawals", icon: ArrowDownToLine },
  { page: "financial", label: "Financial Overview", icon: TrendingUp },
  { page: "balances", label: "Balances", icon: BarChart3 },
  { page: "market", label: "Market Overview", icon: BarChart3 },
  { page: "audit", label: "Audit Logs", icon: ClipboardList },
  { page: "notifications", label: "Notifications", icon: Bell },
  { page: "staff", label: "Staff", icon: ShieldCheck },
];

export function Backoffice({ onSignOut }: { onSignOut: () => void }) {
  const { toast } = useToast();
  const [page, setPage] = useState<AdminPage>("dashboard");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<AdminState | null>(null);

  const toastFn = useCallback(
    (title: string, description?: string) => toast({ title, description }),
    [toast],
  );

  /* ---- one source of truth: the server snapshot ---- */
  const refresh = useCallback(async () => {
    const res = await apiAdminGet();
    if (!res.ok) {
      if (res.error === "unauthorized") {
        toastFn("Session expired", "Please sign in again.");
        onSignOut();
      }
      return;
    }
    if (res.snapshot) {
      setState(res.snapshot);
      setLoading(false);
    }
  }, [onSignOut, toastFn]);

  useEffect(() => {
    const boot = () => {
      void refresh();
    };
    boot();
    const id = setInterval(boot, 15000); // keep tabs in sync even when idle
    window.addEventListener("focus", boot);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", boot);
    };
  }, [refresh]);

  const runAction = useCallback(
    async (action: AdminAction, successToast?: { title: string; description?: string }): Promise<boolean> => {
      const res = await apiAdminAction(action);
      if (!res.ok) {
        const messages: Record<string, string> = {
          unauthorized: "Your session expired. Sign in again.",
          taken: "That email is already used by another client.",
          invalid: "Please check the form — some fields are missing or invalid.",
          weak: "The password must be at least 6 characters.",
          "wrong-current": "The current password is incorrect.",
          "demo-protected": "The demo account cannot be deleted.",
          self: "You cannot remove your own account.",
          "already-reviewed": "This request has already been approved or rejected.",
          "client-not-found": "Select a client for this transaction.",
          amount: "Enter a valid amount greater than zero.",
          "not-found": "That record no longer exists.",
          network: "Network error — please try again.",
        };
        toastFn("Action failed", messages[res.error ?? ""] ?? "Something went wrong. Please try again.");
        // still refresh so the UI reflects reality
        await refresh();
        return false;
      }
      if (res.snapshot) setState(res.snapshot);
      if (successToast) toastFn(successToast.title, successToast.description);
      return true;
    },
    [refresh, toastFn],
  );

  const navigate = useCallback((p: AdminPage, clientId?: string) => {
    setPage(p);
    if (clientId !== undefined) setSelectedClientId(clientId);
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }, []);

  const unreadCount = useMemo(() => state?.notifications.filter((n) => n.unread).length ?? 0, [state]);

  const ctx: AdminCtx | null = useMemo(() => {
    if (!state) return null;
    return {
      state,
      page,
      selectedClientId,
      unreadCount,
      navigate,
      runAction,
      refresh,
      toast: toastFn,
    };
  }, [state, page, selectedClientId, unreadCount, navigate, runAction, refresh, toastFn]);

  const signOut = useCallback(async () => {
    await apiLogout("admin");
    onSignOut();
  }, [onSignOut]);

  const sidebarNode = (mobile = false) => (
    <div className={cn("flex h-full flex-col bg-[#0d1a2b]", collapsed && !mobile ? "w-[78px]" : "w-[264px]")}>
      {/* Brand */}
      <div className={cn("flex h-[72px] shrink-0 items-center gap-3 border-b border-white/[0.06]", collapsed && !mobile ? "justify-center px-2" : "px-5")}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/10">
          <LogoMark className="h-6 w-6 text-[#00E5A0]" />
        </div>
        {(!collapsed || mobile) && (
          <div className="min-w-0">
            <p className="truncate text-[0.9375rem] font-bold leading-tight text-white">CryptoWise</p>
            <p className="truncate text-xs text-slate-400">Administration</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          const active = page === item.page || (page === "client-detail" && item.page === "clients");
          const Icon = item.icon;
          const badge =
            item.page === "withdrawals" && (state?.stats.pendingWithdrawals ?? 0) > 0
              ? state!.stats.pendingWithdrawals
              : item.page === "requests" && (state?.stats.pendingAccountRequests ?? 0) > 0
                ? state!.stats.pendingAccountRequests
                : null;
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
              {(!collapsed || mobile) && (
                <>
                  <span className="truncate">{item.label}</span>
                  {badge !== null && (
                    <span className="ms-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[0.625rem] font-bold text-[#451a03]">{badge}</span>
                  )}
                </>
              )}
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
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[0.625rem] font-bold text-[#451a03]">
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
          {!ctx || loading ? (
            <div className="flex min-h-[50vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            <>
              {page === "dashboard" && <DashboardPage ctx={ctx} />}
              {page === "clients" && <ClientsPage ctx={ctx} />}
              {page === "client-detail" && <ClientDetailPage ctx={ctx} />}
              {page === "requests" && <RequestsPage ctx={ctx} />}
              {page === "transactions" && <TransactionsPage ctx={ctx} />}
              {page === "deposits" && <DepositsPage ctx={ctx} />}
              {page === "withdrawals" && <WithdrawalsPage ctx={ctx} />}
              {page === "balances" && <BalancesPage ctx={ctx} />}
              {page === "financial" && <FinancialPage ctx={ctx} />}
              {page === "market" && <MarketPage ctx={ctx} />}
              {page === "audit" && <AuditPage ctx={ctx} />}
              {page === "notifications" && <NotificationsPage ctx={ctx} />}
              {page === "staff" && <StaffPage ctx={ctx} />}
              {page === "profile" && <ProfilePage ctx={ctx} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
