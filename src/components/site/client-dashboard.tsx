"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CalendarDays,
  Crown,
  Download,
  Landmark,
  LifeBuoy,
  LogOut,
  Mail,
  MessageSquare,
  Phone,
  PieChart,
  Repeat,
  ShieldAlert,
  TrendingUp,
  X,
} from "lucide-react";
import { CoinBadge, LogoMark } from "./icons";
import { useToast } from "@/hooks/use-toast";
import { formatChange, formatPrice, sparkline, sparklinePath, type Coin } from "@/lib/market";
import {
  addPortalRequest,
  getAccountById,
  getRequestsForAccount,
  setSession,
  type ClientAccount,
  type ClientTx,
  type PortalRequest,
} from "@/lib/client-auth";
import type { Lang, StringKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const MINT = "#00E5A0";

function usd(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtUnits(units: number): string {
  return units.toLocaleString("en-US", { maximumFractionDigits: units >= 1 ? 2 : 4 });
}

function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtMonth(iso: string, lang: Lang): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return d.toLocaleDateString(lang === "ar" ? "ar" : "en-US", { month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "C";
}

function seedFor(id: string): number {
  let s = 0;
  for (let i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) % 233280;
  return s || 7;
}

export function ClientDashboard({
  t,
  lang,
  account,
  coins,
  stocks,
  onLangToggle,
  onSignOut,
}: {
  t: (k: StringKey) => string;
  lang: Lang;
  account: ClientAccount;
  coins: Coin[];
  stocks: Coin[];
  onLangToggle: () => void;
  onSignOut: () => void;
}) {
  const { toast } = useToast();

  /* ---- Live self-refresh: the Super Admin controls every figure on this
         dashboard from the CRM, so the store is re-read on every market
         tick (3s) and whenever the tab regains focus. ---- */
  const [acct, setAcct] = useState<ClientAccount>(account);
  const [requests, setRequests] = useState<PortalRequest[]>(() => getRequestsForAccount(account.id));
  const [txFilter, setTxFilter] = useState<"all" | "in" | "out">("all");
  const [reqModal, setReqModal] = useState<null | "deposit" | "withdrawal">(null);
  const [reqAmount, setReqAmount] = useState("");
  const [reqNote, setReqNote] = useState("");

  const acctId = account.id;
  const emailRef = useRef(account.email);
  useEffect(() => {
    const sync = () => {
      const fresh = getAccountById(acctId);
      if (!fresh) {
        toast({ title: t("accountClosedToast") });
        onSignOut();
        return;
      }
      if (fresh.email !== emailRef.current) {
        emailRef.current = fresh.email;
        setSession(fresh); // follow the account if the admin changed its email
      }
      setAcct(fresh);
      setRequests(getRequestsForAccount(acctId));
    };
    sync();
    const id = setInterval(sync, 3000);
    window.addEventListener("focus", sync);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", sync);
    };
  }, [acctId, onSignOut, t, toast]);

  const markets = useMemo(() => [...coins, ...stocks], [coins, stocks]);

  const rows = useMemo(
    () =>
      acct.holdings
        .map((h) => {
          const coin = markets.find((m) => m.id === h.assetId);
          if (!coin) return null;
          // deterministic sparkline whose overall direction matches the 24h trend
          const base = sparkline(seedFor(coin.id), 24, 1.15);
          const trend = coin.change24h >= 0 ? 7 : -7;
          const series = base.map((v, i) => v + (i / (base.length - 1)) * trend);
          const sparkPath = sparklinePath(series, 72, 28);
          return { units: h.units, coin, value: coin.price * h.units, sparkPath };
        })
        .filter((r): r is { units: number; coin: Coin; value: number; sparkPath: string } => r !== null),
    [acct.holdings, markets],
  );

  const invested = rows.reduce((s, r) => s + r.value, 0);
  const total = acct.cash + invested;
  const portfolioChange = invested > 0 ? rows.reduce((s, r) => s + r.coin.change24h * r.value, 0) / invested : 0;
  const totalDeposits = acct.txs
    .filter((tx) => tx.dir === "in" && tx.status === "Completed")
    .reduce((s, tx) => s + (tx.amountUsd ?? 0), 0);

  const allocation = useMemo(() => {
    const segs = rows.map((r) => ({ label: r.coin.name, value: r.value, color: r.coin.color }));
    if (acct.cash > 0) segs.unshift({ label: t("cash"), value: acct.cash, color: MINT });
    const sum = segs.reduce((s, x) => s + x.value, 0) || 1;
    return segs.map((s) => ({ ...s, pct: (s.value / sum) * 100 }));
  }, [rows, acct.cash, t]);

  const filteredTxs = useMemo(
    () => acct.txs.filter((tx) => txFilter === "all" || tx.dir === txFilter),
    [acct.txs, txFilter],
  );

  const firstName = acct.name.trim().split(/\s+/)[0] ?? acct.name;
  const suspended = acct.status === "suspended";

  /* ---- Live session performance chart ---- */
  const [history, setHistory] = useState<number[]>([]);
  useEffect(() => {
    const seed = () => {
      const pts: number[] = [];
      let v = total * 0.982;
      let s = Math.max(1, Math.floor(total)) % 233280 || 13;
      const rand = () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
      for (let i = 0; i < 42; i++) {
        v += total * (rand() - 0.47) * 0.004;
        pts.push(Math.max(total * 0.9, v));
      }
      pts[pts.length - 1] = total;
      setHistory(pts);
    };
    seed();
  }, []);

  const lastTotalRef = useRef(total);
  useEffect(() => {
    const append = () => {
      lastTotalRef.current = total;
      setHistory((h) => [...h.slice(-79), total]);
    };
    if (history.length === 0) return;
    if (Math.abs(total - lastTotalRef.current) < 0.005) return;
    append();
  }, [total, history.length]);

  const chart = useMemo(() => {
    const pts = history.length > 1 ? history : [total, total];
    const max = Math.max(...pts);
    const min = Math.min(...pts);
    const range = max - min || Math.max(1, max * 0.002);
    const W = 560;
    const H = 180;
    const pad = range * 0.3;
    const lo = min - pad;
    const hi = max + pad;
    const step = W / (pts.length - 1);
    const coords = pts.map((v, i) => [i * step, H - ((v - lo) / (hi - lo)) * H] as const);
    const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    const area = `${line} L${W},${H} L0,${H} Z`;
    const lastYPct = (coords[coords.length - 1][1] / H) * 100;
    return { line, area, lastYPct, min, max };
  }, [history, total]);

  /* ---- Client requests (deposit / withdrawal) ---- */
  const submitRequest = () => {
    if (!reqModal) return;
    const amount = parseFloat(reqAmount.replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: t("requestInvalid"), variant: "destructive" });
      return;
    }
    if (reqModal === "withdrawal" && amount > acct.cash) {
      toast({ title: t("requestTooMuch"), variant: "destructive" });
      return;
    }
    addPortalRequest({ account: acct, type: reqModal, amount, note: reqNote });
    setRequests(getRequestsForAccount(acct.id));
    setReqModal(null);
    setReqAmount("");
    setReqNote("");
    toast({ title: t("requestSent"), description: t("requestSentSub") });
  };

  const downloadCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = acct.txs.map((tx) =>
      [
        tx.dateISO,
        tx.kind,
        esc(tx.labelKey ? t(tx.labelKey) : (tx.label ?? "")),
        esc(tx.asset ?? ""),
        tx.dir === "in" ? "Credit" : "Debit",
        `${tx.dir === "in" ? "+" : "-"}${(tx.amountUsd ?? 0).toFixed(2)}`,
        tx.status,
      ].join(","),
    );
    const csv = ["Date,Type,Description,Details,Direction,Amount (USD),Status", ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cryptowise-statement-${acct.accountNo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: t("statementToast") });
  };

  const quick = (title: StringKey, sub: StringKey) => () => toast({ title: t(title), description: t(sub) });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04121c]">
      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-40 start-1/4 h-[420px] w-[420px] rounded-full bg-[#00E5A0]/[0.05] blur-[140px]" />
        <div className="absolute bottom-0 end-0 h-[360px] w-[360px] rounded-full bg-amber-400/[0.04] blur-[130px]" />
      </div>

      {/* ---------- Topbar ---------- */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#031019]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={onSignOut}
              aria-label="CryptoWise — home"
              className="flex items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#00E5A0]/60"
            >
              <LogoMark className="h-9 w-9 shrink-0" />
              <span className="flex flex-col items-start leading-tight">
                <span className={cn("text-[16px] font-semibold tracking-tight text-white", lang === "ar" && "text-[15px]")}>
                  {lang === "ar" ? "كريبتو وايز" : "CryptoWise"}
                </span>
                <span className="hidden text-[9.5px] font-medium uppercase tracking-[0.2em] text-[#00E5A0]/80 sm:block">
                  {t("tagline")}
                </span>
              </span>
            </button>
            <span className="hidden rounded-md bg-amber-400/12 px-2 py-0.5 text-[10.5px] font-bold tracking-wide text-amber-400 lg:inline-block">
              {t("clientPortal")}
            </span>
            <span
              className="hidden rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10.5px] font-bold tracking-wide text-white/50 xl:inline-block"
              dir="ltr"
            >
              {acct.accountNo}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onLangToggle}
              aria-label="Toggle language"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[13px] font-bold text-white/70 transition-colors hover:text-white"
            >
              {lang === "en" ? "AR" : "EN"}
            </button>

            <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pe-1.5 ps-1.5 sm:pe-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2cf0b5] to-[#0a8f63] text-[13px] font-bold text-[#03291d]">
                {initials(acct.name)}
              </span>
              <span className="hidden text-left leading-tight sm:block" dir={lang === "ar" ? "rtl" : "ltr"}>
                <span className="block max-w-[140px] truncate text-[13px] font-bold text-white">{acct.name}</span>
                <span className="block text-[10.5px] font-semibold text-amber-400">{t("privateClient")}</span>
              </span>
            </div>

            <button
              onClick={onSignOut}
              aria-label={t("signOut")}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[13px] font-semibold text-white/70 transition-colors hover:text-white"
            >
              <LogOut className="h-4 w-4 rtl:-scale-x-100" />
              <span className="hidden sm:inline">{t("signOut")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ---------- Main ---------- */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6">
        {/* welcome */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[28px]">
              {t("welcomeBack")}, {firstName}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#00E5A0]/25 bg-[#00E5A0]/10 px-2.5 py-1 text-[11px] font-bold text-[#00E5A0]">
              <BadgeCheck className="h-3.5 w-3.5" />
              {t("verified")}
            </span>
            <TierBadge tier={acct.tier} t={t} />
            <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-white/50 sm:inline-flex">
              <CalendarDays className="h-3.5 w-3.5 text-white/35" />
              {t("memberSince")} <span dir="ltr">{fmtMonth(acct.createdAtISO, lang)}</span>
            </span>
          </div>
          <p className="mt-1.5 text-[13.5px] text-white/50">
            {t("welcomeSub")}{" "}
            <span className="text-white/35">
              · {t("accountNo")}{" "}
              <span dir="ltr" className="font-semibold text-white/60">
                {acct.accountNo}
              </span>
            </span>
          </p>
        </motion.div>

        {/* manager note — written by the Super Admin in the CRM */}
        {acct.managerNote.trim().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="mt-4 flex items-start gap-3 rounded-2xl border border-[#00E5A0]/15 bg-[#00E5A0]/[0.05] px-5 py-4"
          >
            <MessageSquare className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#00E5A0]" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#00E5A0]/80">{t("managerNoteTitle")}</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-white/70">{acct.managerNote}</p>
            </div>
          </motion.div>
        )}

        {/* suspended by the Super Admin */}
        {suspended && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] px-5 py-4"
          >
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="text-[14px] font-bold text-amber-300">{t("suspendedBanner")}</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-amber-200/60">{t("suspendedSub")}</p>
            </div>
          </motion.div>
        )}

        {/* stat cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            delay={0.05}
            label={t("totalBalance")}
            value={<span dir="ltr">{usd(total)}</span>}
            icon={<Banknote className="h-5 w-5" />}
            accent
            delta={
              portfolioChange !== 0 ? (
                <span
                  dir="ltr"
                  className={cn("text-[12px] font-bold", portfolioChange >= 0 ? "text-[#00E5A0]" : "text-amber-400")}
                >
                  {formatChange(portfolioChange)}
                </span>
              ) : undefined
            }
            deltaLabel={t("change24h")}
          />
          <StatCard delay={0.08} label={t("cashAvailable")} value={<span dir="ltr">{usd(acct.cash)}</span>} icon={<Landmark className="h-5 w-5" />} />
          <StatCard delay={0.11} label={t("invested")} value={<span dir="ltr">{usd(invested)}</span>} icon={<PieChart className="h-5 w-5" />} />
          <StatCard delay={0.14} label={t("totalDeposits")} value={<span dir="ltr">{usd(totalDeposits)}</span>} icon={<TrendingUp className="h-5 w-5" />} />
        </div>

        {/* live performance chart */}
        <Panel
          delay={0.18}
          title={t("performance")}
          icon={<TrendingUp className="h-4.5 w-4.5 text-[#00E5A0]" />}
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00E5A0]/25 bg-[#00E5A0]/10 px-2.5 py-1 text-[10.5px] font-bold text-[#00E5A0]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00E5A0] opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#00E5A0]" />
              </span>
              {t("live")}
            </span>
          }
        >
          <div className="px-2 pb-4 pt-2">
            <div className="relative h-44" dir="ltr">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 560 180" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="perfFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={MINT} stopOpacity="0.28" />
                    <stop offset="100%" stopColor={MINT} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={chart.area} fill="url(#perfFill)" />
                <path
                  d={chart.line}
                  fill="none"
                  stroke={MINT}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <span
                className="absolute h-2 w-2 -translate-y-1/2 rounded-full bg-[#00E5A0] shadow-[0_0_14px_rgba(0,229,160,0.9)]"
                style={{ top: `${chart.lastYPct}%`, right: 6 }}
              />
              <span className="absolute left-3 top-1.5 text-[10px] font-semibold tabular-nums text-white/30">
                <span dir="ltr">{usd(chart.max)}</span>
              </span>
              <span className="absolute bottom-1.5 left-3 text-[10px] font-semibold tabular-nums text-white/30">
                <span dir="ltr">{usd(chart.min)}</span>
              </span>
            </div>
          </div>
        </Panel>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          {/* ---------- left column ---------- */}
          <div className="flex min-w-0 flex-col gap-6">
            {/* holdings */}
            <Panel delay={0.2} title={t("holdings")} icon={<PieChart className="h-4.5 w-4.5 text-[#00E5A0]" />}>
              {rows.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-12 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/10">
                    <PieChart className="h-6 w-6 text-white/30" />
                  </span>
                  <p className="mt-4 text-[15px] font-bold text-white">{t("noAssets")}</p>
                  <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-white/45">{t("noAssetsSub")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-start text-[12px] font-medium text-white/40">
                        <th className="px-5 py-3 text-start font-medium">{t("markets")}</th>
                        <th className="hidden px-3 py-3 text-start font-medium md:table-cell"></th>
                        <th className="px-3 py-3 text-end font-medium">{t("units")}</th>
                        <th className="px-3 py-3 text-end font-medium">{t("price")}</th>
                        <th className="px-3 py-3 text-end font-medium">{t("value")}</th>
                        <th className="px-5 py-3 text-end font-medium">{t("change24h")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.coin.id} className="border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.02]">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <CoinBadge glyph={r.coin.glyph} gradient={r.coin.gradient} className="h-9 w-9 text-[15px]" />
                              <div className="min-w-0">
                                <p className="truncate text-[13.5px] font-bold text-white">{r.coin.name}</p>
                                <p className="text-[11px] text-white/40" dir="ltr">
                                  {r.coin.symbol}
                                  {r.coin.exchange ? ` · ${r.coin.exchange}` : ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden px-3 py-3.5 md:table-cell">
                            <svg viewBox="0 0 72 28" className="h-7 w-[72px]" preserveAspectRatio="none" aria-hidden="true">
                              <path
                                d={r.sparkPath}
                                fill="none"
                                stroke={r.coin.change24h >= 0 ? MINT : "#fbbf24"}
                                strokeWidth="1.6"
                                strokeLinecap="round"
                              />
                            </svg>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 text-end tabular-nums text-white/70">
                            <span dir="ltr">{fmtUnits(r.units)}</span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 text-end tabular-nums text-white/70">
                            <span dir="ltr">{formatPrice(r.coin.price)}</span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 text-end">
                            <span dir="ltr" className="block font-bold tabular-nums text-white">
                              {usd(r.value)}
                            </span>
                            <span dir="ltr" className="text-[11px] font-semibold text-white/35">
                              {total > 0 ? ((r.value / total) * 100).toFixed(1) : "0.0"}%
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-end">
                            <span
                              dir="ltr"
                              className={cn(
                                "text-[13px] font-bold tabular-nums",
                                r.coin.change24h >= 0 ? "text-[#00E5A0]" : "text-amber-400",
                              )}
                            >
                              {formatChange(r.coin.change24h)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            {/* transactions */}
            <Panel
              delay={0.25}
              title={t("recentTransactions")}
              icon={<Repeat className="h-4.5 w-4.5 text-[#00E5A0]" />}
              action={
                <>
                  <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
                    {(["all", "in", "out"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setTxFilter(f)}
                        aria-pressed={txFilter === f}
                        className={cn(
                          "rounded-md px-2 py-1 text-[11px] font-bold transition-colors",
                          txFilter === f ? "bg-[#00E5A0]/15 text-[#00E5A0]" : "text-white/45 hover:text-white",
                        )}
                      >
                        {f === "all" ? t("filterAll") : f === "in" ? t("filterIn") : t("filterOut")}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={downloadCsv}
                    title={t("downloadStatement")}
                    aria-label={t("downloadStatement")}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/50 transition-colors hover:text-[#00E5A0]"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </>
              }
            >
              {filteredTxs.length === 0 ? (
                <div className="px-6 py-10 text-center text-[13.5px] text-white/45">{t("noTx")}</div>
              ) : (
                <ul className="divide-y divide-white/[0.04]">
                  {filteredTxs.map((tx) => (
                    <li key={tx.id} className="flex items-center gap-3.5 px-5 py-3.5">
                      <TxIcon kind={tx.kind} dir={tx.dir} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="truncate text-[13.5px] font-semibold text-white">
                            {tx.labelKey ? t(tx.labelKey) : tx.label}
                          </p>
                          {tx.status === "Processing" && (
                            <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                              {t("statusProcessing")}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11.5px] text-white/40">
                          <span dir="ltr">{fmtDate(tx.dateISO)}</span>
                          {tx.asset ? (
                            <>
                              {" · "}
                              <span dir="ltr">{tx.asset}</span>
                            </>
                          ) : null}
                          {tx.status === "Completed" ? ` · ${t("statusCompleted")}` : ""}
                        </p>
                      </div>
                      {typeof tx.amountUsd === "number" && (
                        <span
                          dir="ltr"
                          className={cn(
                            "whitespace-nowrap text-[13.5px] font-bold tabular-nums",
                            tx.dir === "in" ? "text-[#00E5A0]" : "text-amber-400",
                          )}
                        >
                          {tx.dir === "in" ? "+" : "−"}
                          {usd(tx.amountUsd)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          {/* ---------- right column ---------- */}
          <div className="flex min-w-0 flex-col gap-6">
            {/* quick actions */}
            <Panel delay={0.3} title={t("quickActions")} icon={<ArrowUpRight className="h-4.5 w-4.5 text-[#00E5A0]" />}>
              <div className="grid grid-cols-3 gap-2.5 px-5 pb-5 pt-4">
                <QuickButton
                  onClick={() => setReqModal("deposit")}
                  disabled={suspended}
                  label={t("deposit")}
                  icon={<ArrowDownLeft className="h-4.5 w-4.5" />}
                  primary
                />
                <QuickButton
                  onClick={() => setReqModal("withdrawal")}
                  disabled={suspended}
                  label={t("withdraw")}
                  icon={<ArrowUpRight className="h-4.5 w-4.5" />}
                />
                <QuickButton
                  onClick={quick("tradeRequest", "tradeRequestSub")}
                  disabled={suspended}
                  label={t("trade")}
                  icon={<Repeat className="h-4.5 w-4.5" />}
                />
              </div>
            </Panel>

            {/* my requests — reviewed by the Super Admin in the CRM */}
            <Panel delay={0.33} title={t("myRequests")} icon={<ArrowDownLeft className="h-4.5 w-4.5 text-[#00E5A0]" />}>
              {requests.length === 0 ? (
                <div className="px-5 pb-5 pt-4 text-[12.5px] leading-relaxed text-white/40">{t("requestHint")}</div>
              ) : (
                <ul className="divide-y divide-white/[0.04]">
                  {requests.slice(0, 6).map((r) => (
                    <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1",
                          r.type === "deposit"
                            ? "bg-[#00E5A0]/12 text-[#00E5A0] ring-[#00E5A0]/25"
                            : "bg-amber-400/12 text-amber-400 ring-amber-400/25",
                        )}
                      >
                        {r.type === "deposit" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-semibold text-white">
                          {r.type === "deposit" ? t("deposit") : t("withdraw")}{" "}
                          <span dir="ltr" className="tabular-nums">
                            {usd(r.amount)}
                          </span>
                        </p>
                        <p className="text-[11px] text-white/40">
                          <span dir="ltr">{r.createdAtLabel}</span>
                        </p>
                      </div>
                      <ReqStatusChip status={r.status} t={t} />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            {/* allocation */}
            <Panel delay={0.36} title={t("allocation")} icon={<PieChart className="h-4.5 w-4.5 text-[#00E5A0]" />}>
              <div className="px-5 pb-5 pt-4">
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  {allocation.map((s, i) => (
                    <span key={`${s.label}-${i}`} style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                  ))}
                </div>
                <ul className="mt-4 space-y-2.5">
                  {allocation.map((s, i) => (
                    <li key={`${s.label}-legend-${i}`} className="flex items-center justify-between gap-2 text-[12.5px]">
                      <span className="flex min-w-0 items-center gap-2 text-white/60">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="truncate">{s.label}</span>
                      </span>
                      <span dir="ltr" className="shrink-0 font-bold tabular-nums text-white/80">
                        {s.pct.toFixed(1)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>

            {/* market watch */}
            <Panel delay={0.4} title={t("marketWatch")} icon={<Banknote className="h-4.5 w-4.5 text-[#00E5A0]" />}>
              <ul className="divide-y divide-white/[0.04]">
                {[...coins.slice(0, 5), ...stocks].map((c) => (
                  <li key={`mw-${c.id}`} className="flex items-center gap-3 px-5 py-2.5">
                    <CoinBadge glyph={c.glyph} gradient={c.gradient} className="h-7 w-7 text-[12px]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-white">{c.name}</p>
                    </div>
                    <span dir="ltr" className="text-[12.5px] font-semibold tabular-nums text-white/75">
                      {formatPrice(c.price)}
                    </span>
                    <span
                      dir="ltr"
                      className={cn(
                        "w-[52px] text-end text-[11.5px] font-bold tabular-nums",
                        c.change24h >= 0 ? "text-[#00E5A0]" : "text-amber-400",
                      )}
                    >
                      {formatChange(c.change24h)}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>

            {/* support */}
            <Panel delay={0.45} title={t("supportTitle")} icon={<LifeBuoy className="h-4.5 w-4.5 text-[#00E5A0]" />}>
              <div className="px-5 pb-5 pt-4">
                <p className="text-[12.5px] leading-relaxed text-white/50">{t("supportSub")}</p>
                <div className="mt-3.5 space-y-2 text-[13px] font-semibold text-white/80">
                  <a href="tel:+447441909000" className="flex items-center gap-2.5 transition-colors hover:text-[#00E5A0]">
                    <Phone className="h-4 w-4 text-[#00E5A0]" />
                    <span dir="ltr">+44 744190 9000</span>
                  </a>
                  <a href="mailto:support@cryptowiseuk.com" className="flex items-center gap-2.5 transition-colors hover:text-[#00E5A0]">
                    <Mail className="h-4 w-4 text-[#00E5A0]" />
                    <span dir="ltr">support@cryptowiseuk.com</span>
                  </a>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </main>

      {/* ---------- deposit / withdrawal request modal ---------- */}
      {reqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#010a10]/80 backdrop-blur-sm" onClick={() => setReqModal(null)} />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25 }}
            role="dialog"
            aria-modal="true"
            aria-label={reqModal === "deposit" ? t("requestTitleDeposit") : t("requestTitleWithdraw")}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#071923] p-6 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {reqModal === "deposit" ? t("requestTitleDeposit") : t("requestTitleWithdraw")}
                </h3>
                <p className="mt-1 text-[12px] text-white/45">
                  {t("cashAvailable")}:{" "}
                  <span dir="ltr" className="font-bold text-white/70">
                    {usd(acct.cash)}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setReqModal(null)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/50 transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-white/60">{t("requestAmount")}</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={reqAmount}
                  onChange={(e) => setReqAmount(e.target.value)}
                  placeholder="0.00"
                  dir="ltr"
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-white placeholder:text-white/25 outline-none transition focus:border-[#00E5A0]/40 focus:ring-2 focus:ring-[#00E5A0]/10"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-white/60">{t("requestNote")}</span>
                <textarea
                  rows={2}
                  value={reqNote}
                  onChange={(e) => setReqNote(e.target.value)}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-[#00E5A0]/40 focus:ring-2 focus:ring-[#00E5A0]/10"
                />
              </label>
              <p className="text-[11.5px] leading-relaxed text-white/35">{t("requestHint")}</p>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setReqModal(null)}
                  className="h-11 flex-1 rounded-xl border border-white/10 text-[13.5px] font-semibold text-white/70 transition-colors hover:text-white"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={submitRequest}
                  className="h-11 flex-1 rounded-xl bg-[#00E5A0] text-[13.5px] font-bold text-[#03291d] shadow-[0_10px_36px_-10px_rgba(0,229,160,0.6)] transition-all hover:bg-[#2cf0b5] active:scale-[0.99]"
                >
                  {t("requestSubmit")}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ---------------- building blocks ---------------- */

function TierBadge({ tier, t }: { tier: ClientAccount["tier"]; t: (k: StringKey) => string }) {
  const label = tier === "Private" ? t("tierPrivate") : tier === "Premium" ? t("tierPremium") : t("tierStandard");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold",
        tier === "Private"
          ? "border-amber-400/40 bg-gradient-to-r from-amber-400/20 to-amber-300/10 text-amber-300"
          : tier === "Premium"
            ? "border-amber-400/25 bg-amber-400/10 text-amber-400"
            : "border-white/15 bg-white/[0.05] text-white/60",
      )}
    >
      {tier === "Private" && <Crown className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}

function ReqStatusChip({ status, t }: { status: PortalRequest["status"]; t: (k: StringKey) => string }) {
  const label = status === "Pending" ? t("reqPending") : status === "Approved" ? t("reqApproved") : t("reqRejected");
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold",
        status === "Pending"
          ? "border-amber-400/30 bg-amber-400/10 text-amber-400"
          : status === "Approved"
            ? "border-[#00E5A0]/30 bg-[#00E5A0]/10 text-[#00E5A0]"
            : "border-white/15 bg-white/[0.04] text-white/45",
      )}
    >
      {label}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
  delta,
  deltaLabel,
  delay,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent?: boolean;
  delta?: React.ReactNode;
  deltaLabel?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5",
        accent
          ? "border-[#00E5A0]/25 bg-gradient-to-br from-[#00E5A0]/[0.08] to-transparent"
          : "border-white/[0.07] bg-white/[0.03]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12.5px] font-medium text-white/50">{label}</p>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            accent ? "bg-[#00E5A0]/12 text-[#00E5A0]" : "bg-white/[0.05] text-white/50",
          )}
        >
          {icon}
        </span>
      </div>
      <p className="mt-2.5 text-[26px] font-bold leading-none tracking-tight text-white">{value}</p>
      {delta && (
        <p className="mt-2 text-[12px] text-white/40">
          {delta} <span className="text-white/35">{deltaLabel}</span>
        </p>
      )}
    </motion.div>
  );
}

function Panel({
  title,
  icon,
  delay,
  action,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  delay: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#071923]/80 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.9)]"
    >
      <div className="flex flex-wrap items-center gap-2.5 border-b border-white/[0.06] px-5 py-4">
        {icon}
        <h2 className="text-[15px] font-bold text-white">{title}</h2>
        {action && <div className="ms-auto flex flex-wrap items-center gap-2">{action}</div>}
      </div>
      {children}
    </motion.section>
  );
}

function TxIcon({ kind, dir }: { kind: ClientTx["kind"]; dir: ClientTx["dir"] }) {
  const isIn = dir === "in";
  const tone = isIn
    ? "bg-[#00E5A0]/12 text-[#00E5A0] ring-[#00E5A0]/25"
    : "bg-amber-400/12 text-amber-400 ring-amber-400/25";
  const icon =
    kind === "trade" ? (
      <Repeat className="h-4 w-4" />
    ) : kind === "opening" ? (
      <Landmark className="h-4 w-4" />
    ) : isIn ? (
      <ArrowDownLeft className="h-4 w-4" />
    ) : (
      <ArrowUpRight className="h-4 w-4" />
    );
  return <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1", tone)}>{icon}</span>;
}

function QuickButton({
  label,
  icon,
  onClick,
  disabled,
  primary,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-[12px] font-bold transition-all active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40",
        primary
          ? "border-[#00E5A0]/40 bg-[#00E5A0]/15 text-[#00E5A0] hover:bg-[#00E5A0]/25"
          : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:text-white",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
