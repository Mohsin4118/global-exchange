"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Clock3, BadgePercent, ArrowDownToLine, ArrowUpFromLine, ChevronRight } from "lucide-react";
import { CoinBadge } from "./icons";
import { formatChange, formatPrice, sparkline, sparklinePath, type Coin } from "@/lib/market";
import type { StringKey } from "@/lib/i18n";

const RANGES = ["1D", "1W", "1M", "3M", "1Y", "ALL"] as const;

export function Hero({
  t,
  coins,
  onRegister,
  onLogin,
}: {
  t: (k: StringKey) => string;
  coins: Coin[];
  onRegister: () => void;
  onLogin: () => void;
}) {
  const [range, setRange] = useState<(typeof RANGES)[number]>("1D");
  const btc = coins[0];
  const eth = coins[1];
  const usdt = coins[2];
  const sol = coins[3];

  const chartSeed = 1 + RANGES.indexOf(range) * 7;
  const path = useMemo(() => sparklinePath(sparkline(chartSeed, 44, 1), 320, 92), [chartSeed]);
  const areaPath = `${path} L320,92 L0,92 Z`;

  return (
    <section id="home" className="relative overflow-hidden">
      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-40 start-1/4 h-[480px] w-[480px] rounded-full bg-[#00E5A0]/[0.07] blur-[130px]" />
        <div className="absolute top-32 end-0 h-[380px] w-[380px] rounded-full bg-teal-400/[0.05] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-14 sm:pt-20 pb-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* left copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#00E5A0]/25 bg-[#00d9b316] px-3.5 py-1.5 text-[12.5px] font-medium text-[#00E5A0]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00E5A0] animate-pulse" />
              {t("heroBadge")}
            </span>

            <h1 className="mt-5 text-4xl sm:text-5xl xl:text-[56px] font-bold tracking-tight text-white leading-[1.08]">
              {t("heroTitle1")}{" "}
              <span className="bg-gradient-to-r from-[#00E5A0] to-teal-300 bg-clip-text text-transparent">
                {t("heroTitle2")}
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-white/60">
              {t("heroSub")}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              {[
                { icon: BadgePercent, label: t("lowFees") },
                { icon: ShieldCheck, label: t("secureRegulated") },
                { icon: Clock3, label: t("support247") },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-2 text-[13.5px] font-medium text-white/70">
                  <Icon className="w-4 h-4 text-[#00E5A0]" />
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={onRegister}
                className="group inline-flex items-center gap-1.5 rounded-xl bg-[#00E5A0] px-6 py-3 text-[14.5px] font-bold text-[#022c20] shadow-[0_8px_32px_-8px_rgba(0,229,160,0.6)] hover:bg-[#2cf0b5] active:scale-[0.98] transition-all"
              >
                {t("getStarted")}
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              </button>
              <button
                onClick={onLogin}
                className="inline-flex items-center rounded-xl border border-white/12 bg-white/[0.04] px-6 py-3 text-[14.5px] font-semibold text-white/85 hover:bg-white/[0.08] transition-colors"
              >
                {t("login")}
              </button>
            </div>
          </motion.div>

          {/* right dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
            className="relative"
          >
            <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-[#00E5A0]/[0.05] blur-2xl" aria-hidden="true" />
            <div className="relative rounded-2xl border border-white/[0.08] bg-[#071923]/85 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)] overflow-hidden">
              <DashboardMockup
                t={t}
                coins={coins}
                btc={btc}
                eth={eth}
                usdt={usdt}
                sol={sol}
                path={path}
                areaPath={areaPath}
                range={range}
                setRange={setRange}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function DashboardMockup({
  t,
  coins,
  btc,
  eth,
  usdt,
  sol,
  path,
  areaPath,
  range,
  setRange,
}: {
  t: (k: StringKey) => string;
  coins: Coin[];
  btc: Coin;
  eth: Coin;
  usdt: Coin;
  sol: Coin;
  path: string;
  areaPath: string;
  range: (typeof RANGES)[number];
  setRange: (r: (typeof RANGES)[number]) => void;
}) {
  const navItems: { key: StringKey; icon: string }[] = [
    { key: "dashboard", icon: "▦" },
    { key: "trade", icon: "⇄" },
    { key: "markets", icon: "▤" },
    { key: "wallet", icon: "◈" },
    { key: "invest", icon: "↗" },
    { key: "earn", icon: "◎" },
    { key: "settings", icon: "⚙" },
  ];

  return (
    <div className="flex text-start" dir="ltr">
      {/* sidebar */}
      <aside className="hidden sm:flex w-[168px] shrink-0 flex-col border-e border-white/[0.06] bg-[#04121c]/80 p-4">
        <div className="flex items-center gap-2.5 px-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00E5A0]/15 text-[11px] font-black text-[#00E5A0]">GXC</span>
        </div>
        <nav className="mt-6 flex flex-col gap-1" aria-hidden="true">
          {navItems.map((item, i) => (
            <span
              key={item.key}
              className={
                i === 0
                  ? "flex items-center gap-2.5 rounded-lg bg-white/[0.06] px-3 py-2 text-[12.5px] font-semibold text-white"
                  : "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-medium text-white/45"
              }
            >
              <span className="text-[13px] opacity-80">{item.icon}</span>
              {t(item.key)}
            </span>
          ))}
        </nav>
        <div className="mt-auto rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
          <p className="text-[10.5px] font-medium uppercase tracking-wide text-white/40">{t("totalBalance")}</p>
          <p className="mt-1 font-mono text-[15px] font-semibold text-white">--</p>
          <div className="mt-2.5 grid grid-cols-2 gap-1.5">
            <span className="flex items-center justify-center gap-1 rounded-md bg-[#00E5A0]/15 py-1.5 text-[10px] font-bold text-[#00E5A0]">
              <ArrowDownToLine className="h-2.5 w-2.5" /> {t("deposit")}
            </span>
            <span className="flex items-center justify-center gap-1 rounded-md bg-white/[0.06] py-1.5 text-[10px] font-bold text-white/70">
              <ArrowUpFromLine className="h-2.5 w-2.5" /> {t("withdraw")}
            </span>
          </div>
        </div>
      </aside>

      {/* main panel */}
      <div className="min-w-0 flex-1 p-4 sm:p-5">
        {/* mobile brand row */}
        <div className="flex items-center justify-between sm:hidden pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#00E5A0]/15 text-[9px] font-black text-[#00E5A0]">GXC</span>
          </div>
          <span className="text-white/30 text-lg leading-none">☰</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-white/40">Bitcoin (BTC)</p>
            <p className="mt-0.5 font-mono text-[12px] text-white/55">BTC / USD</p>
          </div>
          <div className="text-end">
            <p className="font-mono text-[17px] font-bold text-white tabular-nums">{formatPrice(btc.price)}</p>
            <p className={`font-mono text-[11.5px] font-semibold tabular-nums ${btc.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {formatChange(btc.change24h)} (24h)
            </p>
          </div>
        </div>

        {/* chart */}
        <div className="relative mt-3 h-[104px] overflow-hidden rounded-lg border border-white/[0.05] bg-[#020b12]/60">
          <svg viewBox="0 0 320 92" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id="heroChartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E5A0" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#00E5A0" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#heroChartFill)" />
            <path d={path} fill="none" stroke="#00E5A0" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <div className="absolute top-2 start-2 flex gap-1" aria-hidden="true">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={
                  r === range
                    ? "rounded px-1.5 py-0.5 font-mono text-[9.5px] font-bold bg-white/10 text-white"
                    : "rounded px-1.5 py-0.5 font-mono text-[9.5px] font-medium text-white/35 hover:text-white/70"
                }
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* tabs */}
        <div className="mt-3 flex gap-4 border-b border-white/[0.06] px-1" aria-hidden="true">
          {([t("pairs"), t("orders"), t("history"), t("reports")] as string[]).map((label, i) => (
            <span
              key={label}
              className={
                i === 0
                  ? "border-b-2 border-[#00E5A0] pb-1.5 text-[11px] font-semibold text-white"
                  : "pb-1.5 text-[11px] font-medium text-white/35"
              }
            >
              {label}
            </span>
          ))}
        </div>

        {/* top cryptos */}
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">{t("topCryptos")}</p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {[btc, eth, usdt, sol].map((c) => (
              <div key={c.id} className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2">
                <CoinBadge glyph={c.glyph} gradient={c.gradient} className="h-6 w-6 text-[11px]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10.5px] font-semibold text-white/85">{c.name}</p>
                  <p className="font-mono text-[9px] text-white/35">{c.symbol}</p>
                </div>
                <div className="text-end">
                  <p className="font-mono text-[10.5px] font-semibold text-white tabular-nums">{formatPrice(c.price)}</p>
                  <p className={`font-mono text-[9px] font-semibold tabular-nums ${c.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatChange(c.change24h)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
