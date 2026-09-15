"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck, Users, ArrowLeftRight, FileCheck2, LogOut, Search, Wallet,
  TrendingUp, Ticket, Activity, CheckCircle2, XCircle, Ban, RotateCcw, Info, ArrowLeft,
} from "lucide-react";
import { LogoMark } from "./icons";
import { useToast } from "@/hooks/use-toast";
import type { Lang, StringKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const ADMIN_EMAIL = "super@globexchange.co.uk";
const ADMIN_PASSWORD = "Super@2026";

/* ---------------- data seeds ---------------- */

type Kyc = "Verified" | "Pending" | "Rejected";
type UserStatus = "Active" | "Suspended";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  country: string;
  balance: string;
  kyc: Kyc;
  status: UserStatus;
  lastActive: string;
}

interface AdminTx {
  id: string;
  user: string;
  type: "Deposit" | "Withdraw" | "Swap";
  amount: string;
  status: "Completed" | "Pending" | "Rejected";
}

const SEED_USERS: AdminUser[] = [
  { id: 1, name: "Omar Farouk", email: "omar.f@gmail.com", country: "United Kingdom", balance: "$12,450.80", kyc: "Verified", status: "Active", lastActive: "2 min ago" },
  { id: 2, name: "Layla Hassan", email: "layla.h@outlook.com", country: "UAE", balance: "$8,930.25", kyc: "Pending", status: "Active", lastActive: "14 min ago" },
  { id: 3, name: "Daniel Smith", email: "d.smith@yahoo.com", country: "Germany", balance: "$25,102.40", kyc: "Verified", status: "Active", lastActive: "1 h ago" },
  { id: 4, name: "Fatima Noor", email: "fatima.n@gmail.com", country: "Qatar", balance: "$3,210.00", kyc: "Pending", status: "Active", lastActive: "3 h ago" },
  { id: 5, name: "Lucas Meyer", email: "lucas.m@gmail.com", country: "Switzerland", balance: "$57,880.10", kyc: "Verified", status: "Suspended", lastActive: "2 d ago" },
  { id: 6, name: "Aisha Karim", email: "aisha.k@gmail.com", country: "Egypt", balance: "$940.55", kyc: "Rejected", status: "Active", lastActive: "5 h ago" },
  { id: 7, name: "Michael Brown", email: "m.brown@gmail.com", country: "United States", balance: "$41,220.75", kyc: "Verified", status: "Active", lastActive: "22 min ago" },
  { id: 8, name: "Sara Ali", email: "sara.ali@hotmail.com", country: "Saudi Arabia", balance: "$16,705.30", kyc: "Pending", status: "Active", lastActive: "45 min ago" },
];

const SEED_TXS: AdminTx[] = [
  { id: "TX-90412", user: "Omar Farouk", type: "Withdraw", amount: "0.85 BTC", status: "Pending" },
  { id: "TX-90411", user: "Michael Brown", type: "Deposit", amount: "12,500 USDT", status: "Completed" },
  { id: "TX-90410", user: "Layla Hassan", type: "Swap", amount: "3.2 ETH → BTC", status: "Completed" },
  { id: "TX-90409", user: "Daniel Smith", type: "Withdraw", amount: "1.4 ETH", status: "Pending" },
  { id: "TX-90408", user: "Sara Ali", type: "Deposit", amount: "5,000 USDT", status: "Completed" },
  { id: "TX-90407", user: "Lucas Meyer", type: "Swap", amount: "0.5 BTC → USDT", status: "Rejected" },
  { id: "TX-90406", user: "Fatima Noor", type: "Withdraw", amount: "320 USDT", status: "Pending" },
  { id: "TX-90405", user: "Aisha Karim", type: "Deposit", amount: "1.1 BTC", status: "Completed" },
];

/* ---------------- shared bits ---------------- */

function StatusPill({ kind, label }: { kind: "good" | "warn" | "bad" | "off"; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-bold whitespace-nowrap",
        kind === "good" && "bg-emerald-400/12 text-emerald-400",
        kind === "warn" && "bg-amber-400/12 text-amber-400",
        kind === "bad" && "bg-red-400/12 text-red-400",
        kind === "off" && "bg-white/8 text-white/50"
      )}
    >
      {label}
    </span>
  );
}

function MiniButton({
  children,
  onClick,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone: "green" | "red" | "gray";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors whitespace-nowrap",
        tone === "green" && "bg-[#00E5A0]/12 text-[#00E5A0] hover:bg-[#00E5A0]/22",
        tone === "red" && "bg-red-400/12 text-red-400 hover:bg-red-400/22",
        tone === "gray" && "bg-white/8 text-white/70 hover:bg-white/14"
      )}
    >
      {children}
    </button>
  );
}

/* ---------------- Admin login ---------------- */

export function AdminLoginView({
  t,
  lang,
  onBack,
  onSuccess,
}: {
  t: (k: StringKey) => string;
  lang: Lang;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
      toast({ title: t("adminWrong"), variant: "destructive" });
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#04121c]">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 start-1/3 h-[420px] w-[420px] rounded-full bg-red-400/[0.05] blur-[130px]" />
        <div className="absolute bottom-0 end-10 h-[320px] w-[320px] rounded-full bg-[#00E5A0]/[0.04] blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-white/[0.06] bg-[#031019]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <LogoMark className="h-10 w-10" />
            <span className="rounded-md bg-red-400/12 px-2 py-0.5 text-[11px] font-bold text-red-400">{t("adminBadge")}</span>
          </div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-[13px] font-semibold text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t("backHome")}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-red-400/15 bg-[#071923]/90 p-6 sm:p-8 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)]">
            <div className="mb-6 text-center">
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-400/12 text-red-400">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">{t("adminLoginTitle")}</h1>
              <p className="mt-1.5 text-[13px] text-white/50">{t("adminLoginSub")}</p>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-white/60">{t("emailAddress")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@globexchange.co.uk"
                  autoComplete="email"
                  className={cn(
                    "h-11 w-full rounded-xl border bg-white/[0.03] px-4 text-sm text-white placeholder:text-white/25 outline-none focus:ring-2 transition",
                    error ? "border-red-400/50 focus:ring-red-400/15" : "border-white/10 focus:border-red-400/40 focus:ring-red-400/10"
                  )}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-white/60">{t("password")}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  className={cn(
                    "h-11 w-full rounded-xl border bg-white/[0.03] px-4 text-sm text-white placeholder:text-white/25 outline-none focus:ring-2 transition",
                    error ? "border-red-400/50 focus:ring-red-400/15" : "border-white/10 focus:border-red-400/40 focus:ring-red-400/10"
                  )}
                />
                {error && <p className="mt-1.5 text-[12px] font-medium text-red-400">{t("adminWrong")}</p>}
              </div>

              <button
                type="submit"
                className="mt-1 h-12 rounded-xl bg-red-400 text-[15px] font-bold text-[#2a0505] shadow-[0_8px_32px_-8px_rgba(248,113,113,0.5)] hover:bg-red-300 active:scale-[0.99] transition-all"
              >
                {t("signIn")}
              </button>
            </form>

            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
              <p className="text-[11.5px] leading-relaxed text-white/45" dir="ltr">
                <span className="font-bold text-white/60">{t("adminHint")}:</span> {ADMIN_EMAIL} / {ADMIN_PASSWORD}
              </p>
            </div>
          </div>
          <p className="mt-5 text-center text-[11.5px] text-white/30">{t("privatePortal")}</p>
        </motion.div>
      </main>
      <span className="hidden">{lang}</span>
    </div>
  );
}

/* ---------------- Admin panel ---------------- */

type Tab = "overview" | "users" | "transactions" | "kyc";

export function AdminPanelView({
  t,
  onSignOut,
}: {
  t: (k: StringKey) => string;
  onSignOut: () => void;
}) {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<AdminUser[]>(SEED_USERS);
  const [txs, setTxs] = useState<AdminTx[]>(SEED_TXS);
  const [query, setQuery] = useState("");

  const pendingCount = txs.filter((x) => x.status === "Pending").length;
  const kycQueue = users.filter((u) => u.kyc === "Pending");

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, query]);

  const setKyc = (id: number, kyc: Kyc) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, kyc } : u)));
    toast({ title: kyc === "Verified" ? t("userVerifiedToast") : t("txRejectedToast") });
  };

  const setUserStatus = (id: number, status: UserStatus) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
    toast({ title: status === "Suspended" ? t("userSuspendedToast") : t("userReactivatedToast") });
  };

  const setTxStatus = (id: string, status: AdminTx["status"]) => {
    setTxs((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    toast({ title: status === "Completed" ? t("txApprovedToast") : t("txRejectedToast") });
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: "overview", label: t("overview"), icon: Activity },
    { key: "users", label: t("usersTab"), icon: Users, count: users.length },
    { key: "transactions", label: t("transactionsTab"), icon: ArrowLeftRight, count: pendingCount || undefined },
    { key: "kyc", label: t("kycTab"), icon: FileCheck2, count: kycQueue.length || undefined },
  ];

  const statCards = [
    { icon: Users, label: t("totalUsers"), value: "512,847", delta: "+2,314 this week" },
    { icon: TrendingUp, label: t("volume24h"), value: "$184.2M", delta: "+8.4% vs yesterday" },
    { icon: Wallet, label: t("pendingWithdrawals"), value: String(pendingCount), delta: "awaiting approval" },
    { icon: Ticket, label: t("openTickets"), value: "27", delta: "avg. response 6 min" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#04121c]">
      {/* top bar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#031019]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <LogoMark className="h-9 w-9" />
            <span className="hidden sm:block text-[15px] font-semibold text-white">Global Exchange</span>
            <span className="rounded-md bg-red-400/12 px-2 py-0.5 text-[11px] font-bold text-red-400">{t("adminBadge")}</span>
          </div>
          <button
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-[13px] font-semibold text-white/70 hover:text-white hover:border-red-400/40 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4 rtl:rotate-180" />
            {t("signOut")}
          </button>
        </div>
        {/* tabs */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Admin sections">
            {tabs.map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "relative flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-3 text-[13px] font-semibold transition-colors",
                  tab === key ? "text-[#00E5A0]" : "text-white/45 hover:text-white/80"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {count !== undefined && count > 0 && (
                  <span className="rounded-full bg-[#00E5A0]/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#00E5A0]">
                    {count}
                  </span>
                )}
                {tab === key && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#00E5A0]" />}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-6">
        {tab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((s) => (
                <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#00E5A0]/12 text-[#00E5A0]">
                      <s.icon className="h-4.5 w-4.5" />
                    </span>
                  </div>
                  <p className="mt-3.5 font-mono text-2xl font-bold text-white tabular-nums" dir="ltr">{s.value}</p>
                  <p className="mt-0.5 text-[12px] font-medium uppercase tracking-wide text-white/45">{s.label}</p>
                  <p className="mt-1.5 text-[11px] text-emerald-400/90" dir="ltr">{s.delta}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* health */}
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold text-white/85">{t("systemsOperational")}</p>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    100%
                  </span>
                </div>
                <div className="mt-4 flex items-end gap-1" dir="ltr" aria-hidden="true">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <span key={i} className={cn("flex-1 rounded-sm", i === 21 ? "bg-amber-400/60" : "bg-emerald-400/50")} style={{ height: `${14 + ((i * 7) % 12)}px` }} />
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-white/40">
                  <span>{t("uptime")}</span>
                  <span className="font-mono font-bold text-white/70" dir="ltr">99.98%</span>
                </div>
              </div>
              {/* latest pending */}
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
                <p className="text-[13px] font-bold text-white/85">{t("pendingWithdrawals")}</p>
                <div className="mt-3 flex flex-col gap-2">
                  {txs.filter((x) => x.status === "Pending").map((x) => (
                    <div key={x.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.05] px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[11px] text-white/40" dir="ltr">{x.id}</p>
                        <p className="truncate text-[12.5px] font-semibold text-white/85">{x.user}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] font-bold text-white" dir="ltr">{x.amount}</span>
                        <MiniButton tone="green" onClick={() => setTxStatus(x.id, "Completed")}>
                          <CheckCircle2 className="h-3 w-3" /> {t("approve")}
                        </MiniButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-center text-[11px] text-white/30">{t("auditNote")}</p>
          </motion.div>
        )}

        {tab === "users" && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="relative mb-4">
              <Search className="absolute inset-y-0 start-3.5 my-auto h-4 w-4 text-white/30" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchUsers")}
                className="h-11 w-full max-w-md rounded-xl border border-white/10 bg-white/[0.03] ps-10 pe-4 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#00E5A0]/50 focus:ring-2 focus:ring-[#00E5A0]/15 transition"
              />
            </div>
            <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
              <table className="w-full min-w-[760px] text-start text-[13px]">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-white/[0.03] text-white/45">
                    <th className="px-4 py-3 text-start font-semibold">{t("colUser")}</th>
                    <th className="px-4 py-3 text-start font-semibold">{t("colCountry")}</th>
                    <th className="px-4 py-3 text-start font-semibold">{t("colBalance")}</th>
                    <th className="px-4 py-3 text-start font-semibold">{t("colKyc")}</th>
                    <th className="px-4 py-3 text-start font-semibold">{t("colStatus")}</th>
                    <th className="px-4 py-3 text-end font-semibold">{t("colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white">{u.name}</p>
                        <p className="font-mono text-[11px] text-white/35" dir="ltr">{u.email}</p>
                      </td>
                      <td className="px-4 py-3 text-white/60">{u.country}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-white tabular-nums" dir="ltr">{u.balance}</td>
                      <td className="px-4 py-3">
                        <StatusPill kind={u.kyc === "Verified" ? "good" : u.kyc === "Pending" ? "warn" : "bad"} label={u.kyc === "Verified" ? t("verified") : u.kyc === "Pending" ? t("pending") : t("rejected")} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill kind={u.status === "Active" ? "good" : "off"} label={u.status === "Active" ? t("active") : t("suspended")} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          {u.kyc !== "Verified" && (
                            <MiniButton tone="green" onClick={() => setKyc(u.id, "Verified")}>
                              <CheckCircle2 className="h-3 w-3" /> {t("verify")}
                            </MiniButton>
                          )}
                          {u.status === "Active" ? (
                            <MiniButton tone="red" onClick={() => setUserStatus(u.id, "Suspended")}>
                              <Ban className="h-3 w-3" /> {t("suspend")}
                            </MiniButton>
                          ) : (
                            <MiniButton tone="gray" onClick={() => setUserStatus(u.id, "Active")}>
                              <RotateCcw className="h-3 w-3" /> {t("reactivate")}
                            </MiniButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-white/35">{t("kycEmpty")}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {tab === "transactions" && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
              <table className="w-full min-w-[680px] text-[13px]">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-white/[0.03] text-white/45">
                    <th className="px-4 py-3 text-start font-semibold">{t("colId")}</th>
                    <th className="px-4 py-3 text-start font-semibold">{t("colUser")}</th>
                    <th className="px-4 py-3 text-start font-semibold">{t("colType")}</th>
                    <th className="px-4 py-3 text-start font-semibold">{t("colAmount")}</th>
                    <th className="px-4 py-3 text-start font-semibold">{t("colStatus")}</th>
                    <th className="px-4 py-3 text-end font-semibold">{t("colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map((x) => (
                    <tr key={x.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono text-[11.5px] text-white/45" dir="ltr">{x.id}</td>
                      <td className="px-4 py-3 font-semibold text-white">{x.user}</td>
                      <td className="px-4 py-3 text-white/60">{x.type}</td>
                      <td className="px-4 py-3 font-mono font-bold text-white" dir="ltr">{x.amount}</td>
                      <td className="px-4 py-3">
                        <StatusPill kind={x.status === "Completed" ? "good" : x.status === "Pending" ? "warn" : "bad"} label={x.status === "Completed" ? t("completed") : x.status === "Pending" ? t("pending") : t("rejected")} />
                      </td>
                      <td className="px-4 py-3">
                        {x.status === "Pending" ? (
                          <div className="flex justify-end gap-1.5">
                            <MiniButton tone="green" onClick={() => setTxStatus(x.id, "Completed")}>
                              <CheckCircle2 className="h-3 w-3" /> {t("approve")}
                            </MiniButton>
                            <MiniButton tone="red" onClick={() => setTxStatus(x.id, "Rejected")}>
                              <XCircle className="h-3 w-3" /> {t("reject")}
                            </MiniButton>
                          </div>
                        ) : (
                          <span className="block text-end text-[11px] text-white/25">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {tab === "kyc" && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex flex-col gap-3">
            {kycQueue.length === 0 && (
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-10 text-center text-white/40">
                {t("kycEmpty")}
              </div>
            )}
            {kycQueue.map((u) => (
              <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#00E5A0]/70 to-teal-600 text-[15px] font-bold text-[#03251b]">
                    {u.name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-white">{u.name}</p>
                    <p className="font-mono text-[11.5px] text-white/40" dir="ltr">{u.email}</p>
                    <p className="mt-0.5 text-[11px] text-white/35">{t("kycDocs")} · {u.country}</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <MiniButton tone="green" onClick={() => setKyc(u.id, "Verified")}>
                    <CheckCircle2 className="h-3 w-3" /> {t("verify")}
                  </MiniButton>
                  <MiniButton tone="red" onClick={() => setKyc(u.id, "Rejected")}>
                    <XCircle className="h-3 w-3" /> {t("reject")}
                  </MiniButton>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </main>

      <footer className="border-t border-white/[0.06] bg-[#01060b] py-4">
        <p className="text-center text-[11px] text-white/30">{t("auditNote")}</p>
      </footer>
    </div>
  );
}
