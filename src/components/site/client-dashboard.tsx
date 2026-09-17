"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Landmark,
  LifeBuoy,
  LogOut,
  Mail,
  Phone,
  PieChart,
  Repeat,
} from "lucide-react";
import { CoinBadge, LogoMark } from "./icons";
import { useToast } from "@/hooks/use-toast";
import { formatChange, formatPrice, type Coin } from "@/lib/market";
import type { ClientAccount, ClientTx } from "@/lib/client-auth";
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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "C";
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

  const markets = useMemo(() => [...coins, ...stocks], [coins, stocks]);

  const rows = useMemo(
    () =>
      account.holdings
        .map((h) => {
          const coin = markets.find((m) => m.id === h.assetId);
          if (!coin) return null;
          return { units: h.units, coin, value: coin.price * h.units };
        })
        .filter((r): r is { units: number; coin: Coin; value: number } => r !== null),
    [account.holdings, markets],
  );

  const invested = rows.reduce((s, r) => s + r.value, 0);
  const total = account.cash + invested;
  const portfolioChange = invested > 0 ? rows.reduce((s, r) => s + r.coin.change24h * r.value, 0) / invested : 0;

  const allocation = useMemo(() => {
    const segs = rows.map((r) => ({ label: r.coin.name, value: r.value, color: r.coin.color }));
    if (account.cash > 0) segs.unshift({ label: t("cash"), value: account.cash, color: MINT });
    const sum = segs.reduce((s, x) => s + x.value, 0) || 1;
    return segs.map((s) => ({ ...s, pct: (s.value / sum) * 100 }));
  }, [rows, account.cash, t]);

  const firstName = account.name.trim().split(/\s+/)[0] ?? account.name;

  const quick = (title: StringKey, sub: StringKey) => () =>
    toast({ title: t(title), description: t(sub) });

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
              className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#00E5A0]/60 rounded-xl"
            >
              <LogoMark className="h-9 w-9 shrink-0 transition-transform duration-300 group-hover:scale-105" />
              <span className="flex flex-col items-start leading-tight">
                <span className={cn("font-semibold tracking-tight text-white text-[16px]", lang === "ar" && "text-[15px]")}>
                  {lang === "ar" ? "كريبتو وايز" : "CryptoWise"}
                </span>
                <span className="hidden text-[9.5px] tracking-[0.2em] text-[#00E5A0]/80 font-medium uppercase sm:block">
                  {t("tagline")}
                </span>
              </span>
            </button>
            <span className="hidden rounded-md bg-amber-400/12 px-2 py-0.5 text-[10.5px] font-bold tracking-wide text-amber-400 lg:inline-block">
              {t("clientPortal")}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onLangToggle}
              aria-label="Toggle language"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[13px] font-bold text-white/70 hover:text-white transition-colors"
            >
              {lang === "en" ? "AR" : "EN"}
            </button>

            <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pe-1.5 ps-1.5 sm:pe-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2cf0b5] to-[#0a8f63] text-[13px] font-bold text-[#03291d]">
                {initials(account.name)}
              </span>
              <span className="hidden text-left leading-tight sm:block" dir={lang === "ar" ? "rtl" : "ltr"}>
                <span className="block max-w-[140px] truncate text-[13px] font-bold text-white">{account.name}</span>
                <span className="block text-[10.5px] font-semibold text-amber-400">{t("privateClient")}</span>
              </span>
            </div>

            <button
              onClick={onSignOut}
              aria-label={t("signOut")}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[13px] font-semibold text-white/70 hover:text-white transition-colors"
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
          </div>
          <p className="mt-1.5 text-[13.5px] text-white/50">
            {t("welcomeSub")}{" "}
            <span className="text-white/35">
              · {t("accountNo")} <span dir="ltr" className="font-semibold text-white/60">{account.accountNo}</span>
            </span>
          </p>
        </motion.div>

        {/* stat cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            delay={0.05}
            label={t("totalBalance")}
            value={<span dir="ltr">{usd(total)}</span>}
            icon={<Banknote className="h-5 w-5" />}
            accent
            delta={portfolioChange !== 0 ? (
              <span
                dir="ltr"
                className={cn(
                  "text-[12px] font-bold",
                  portfolioChange >= 0 ? "text-[#00E5A0]" : "text-amber-400",
                )}
              >
                {formatChange(portfolioChange)}
              </span>
            ) : undefined}
            deltaLabel={t("change24h")}
          />
          <StatCard
            delay={0.1}
            label={t("cashAvailable")}
            value={<span dir="ltr">{usd(account.cash)}</span>}
            icon={<Landmark className="h-5 w-5" />}
          />
          <StatCard
            delay={0.15}
            label={t("invested")}
            value={<span dir="ltr">{usd(invested)}</span>}
            icon={<PieChart className="h-5 w-5" />}
          />
        </div>

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
                  <table className="w-full min-w-[620px] text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-start text-[12px] font-medium text-white/40">
                        <th className="px-5 py-3 text-start font-medium">{t("markets")}</th>
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
                                  {r.coin.symbol}{r.coin.exchange ? ` · ${r.coin.exchange}` : ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 text-end tabular-nums text-white/70">
                            <span dir="ltr">{fmtUnits(r.units)}</span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 text-end tabular-nums text-white/70">
                            <span dir="ltr">{formatPrice(r.coin.price)}</span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 text-end font-bold tabular-nums text-white">
                            <span dir="ltr">{usd(r.value)}</span>
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
            <Panel delay={0.25} title={t("recentTransactions")} icon={<Repeat className="h-4.5 w-4.5 text-[#00E5A0]" />}>
              {account.txs.length === 0 ? (
                <div className="px-6 py-10 text-center text-[13.5px] text-white/45">{t("noTx")}</div>
              ) : (
                <ul className="divide-y divide-white/[0.04]">
                  {account.txs.map((tx) => (
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
            {/* allocation */}
            <Panel delay={0.3} title={t("allocation")} icon={<PieChart className="h-4.5 w-4.5 text-[#00E5A0]" />}>
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

            {/* quick actions */}
            <Panel delay={0.35} title={t("quickActions")} icon={<ArrowUpRight className="h-4.5 w-4.5 text-[#00E5A0]" />}>
              <div className="grid grid-cols-3 gap-2.5 px-5 pb-5 pt-4">
                <QuickButton
                  onClick={quick("depositRequest", "depositRequestSub")}
                  label={t("deposit")}
                  icon={<ArrowDownLeft className="h-4.5 w-4.5" />}
                  primary
                />
                <QuickButton
                  onClick={quick("withdrawRequest", "withdrawRequestSub")}
                  label={t("withdraw")}
                  icon={<ArrowUpRight className="h-4.5 w-4.5" />}
                />
                <QuickButton
                  onClick={quick("tradeRequest", "tradeRequestSub")}
                  label={t("trade")}
                  icon={<Repeat className="h-4.5 w-4.5" />}
                />
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
                  <a href="tel:+447441909000" className="flex items-center gap-2.5 hover:text-[#00E5A0] transition-colors">
                    <Phone className="h-4 w-4 text-[#00E5A0]" />
                    <span dir="ltr">+44 744190 9000</span>
                  </a>
                  <a href="mailto:support@cryptowiseuk.com" className="flex items-center gap-2.5 hover:text-[#00E5A0] transition-colors">
                    <Mail className="h-4 w-4 text-[#00E5A0]" />
                    <span dir="ltr">support@cryptowiseuk.com</span>
                  </a>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------------- building blocks ---------------- */

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
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", accent ? "bg-[#00E5A0]/12 text-[#00E5A0]" : "bg-white/[0.05] text-white/50")}>
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
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#071923]/80 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.9)]"
    >
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-5 py-4">
        {icon}
        <h2 className="text-[15px] font-bold text-white">{title}</h2>
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
  primary,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-[12px] font-bold transition-all active:scale-[0.97]",
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
