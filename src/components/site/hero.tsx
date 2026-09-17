"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Clock3, BadgePercent, ArrowRight } from "lucide-react";
import { CoinBadge } from "./icons";
import { formatChange, formatPrice, sparkline, sparklinePath, type Coin } from "@/lib/market";
import type { Lang, StringKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const RANGES = ["1D", "1W", "1M", "1Y", "ALL"] as const;

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

  const chartSeed = 1 + RANGES.indexOf(range) * 7;
  const path = useMemo(() => sparklinePath(sparkline(chartSeed, 44, 1), 560, 110), [chartSeed]);
  const areaPath = `${path} L560,110 L0,110 Z`;
  const lastY = useMemo(() => (path.match(/([\d.]+)\s*$/)?.[1] ?? "55"), [path]);
  const up = btc.change24h >= 0;

  return (
    <section id="home" className="relative overflow-hidden">
      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-44 start-[12%] h-[520px] w-[520px] rounded-full bg-[#00E5A0]/[0.06] blur-[140px]" />
        <div className="absolute top-24 end-[-6%] h-[460px] w-[460px] rounded-full bg-teal-400/[0.05] blur-[130px]" />
        <div className="absolute bottom-[-30%] start-1/3 h-[420px] w-[520px] rounded-full bg-[#00E5A0]/[0.05] blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-14 sm:pt-20 pb-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-6 items-center">
          {/* left copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative isolate"
          >
            {/* mobile-only floating asset cluster — Bitcoin kept, satellites added (client request) */}
            <FloatingCluster />

            <span className="inline-flex items-center gap-2 rounded-full border border-[#00E5A0]/25 bg-[#00d9b316] px-4 py-1.5 text-[12.5px] font-medium text-[#00E5A0]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00E5A0] animate-pulse" />
              {t("heroBadge")}
            </span>

            <h1 className="mt-5 text-[42px] sm:text-6xl xl:text-[64px] font-bold tracking-tight text-white leading-[1.04]">
              {t("heroTitle1")}
              <span className="block text-[#00E5A0] drop-shadow-[0_0_28px_rgba(0,229,160,0.35)]">
                {t("heroTitle2")}
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-[15.5px] leading-relaxed text-white/60">
              {t("heroSub")}
            </p>

            {/* trust chips — outlined circle icons like the design */}
            <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4">
              {[
                { icon: BadgePercent, label: t("lowFees") },
                { icon: ShieldCheck, label: t("secureRegulated") },
                { icon: Clock3, label: t("support247") },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-2.5">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#00E5A0]/35 bg-[#00E5A0]/[0.06] text-[#00E5A0]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[13.5px] font-semibold text-white/80">{label}</span>
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={onRegister}
                className="group inline-flex items-center gap-2 rounded-full bg-[#00E5A0] px-7 py-3 text-[14.5px] font-bold text-[#022c20] shadow-[0_8px_36px_-8px_rgba(0,229,160,0.65)] hover:bg-[#2cf0b5] active:scale-[0.98] transition-all"
              >
                {t("getStarted")}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              </button>
              <button
                onClick={onLogin}
                className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] px-7 py-3 text-[14.5px] font-semibold text-white/85 hover:bg-white/[0.08] hover:border-white/20 transition-colors"
              >
                {t("learnMore")}
              </button>
            </div>
          </motion.div>

          {/* right visual — glowing globe + BTC coin on a podium */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-[480px]"
            dir="ltr"
          >
            <GlobeVisual />
          </motion.div>
        </div>

        {/* live BTC chart card */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
          className="relative mt-10 rounded-2xl border border-white/[0.08] bg-[#071923]/85 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)] backdrop-blur px-5 sm:px-6 py-5"
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
            {/* coin identity + price */}
            <div className="flex items-center gap-4 lg:min-w-[300px]">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] border border-white/[0.07]">
                <CoinBadge glyph={btc.glyph} gradient={btc.gradient} className="h-8 w-8 text-sm" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-white">{btc.symbol}</p>
                <p className="text-[11.5px] text-white/40">{btc.name}</p>
                <p className="mt-1.5 font-mono text-[26px] leading-none font-bold text-white tabular-nums">
                  {formatPrice(btc.price)}
                </p>
              </div>
              <span
                dir="ltr"
                className={cn(
                  "ms-auto lg:ms-4 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 font-mono text-[12.5px] font-bold tabular-nums",
                  up ? "bg-[#00E5A0]/12 text-[#00E5A0]" : "bg-amber-400/12 text-amber-400"
                )}
              >
                <span aria-hidden="true">{up ? "▲" : "▼"}</span>
                {formatChange(btc.change24h)} (24h)
              </span>
            </div>

            <div className="hidden lg:block h-14 w-px bg-white/[0.08]" aria-hidden="true" />

            {/* ranges + chart */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-end gap-1.5" dir="ltr">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={cn(
                      "rounded-full px-3 py-1 font-mono text-[11px] font-bold transition-colors",
                      r === range
                        ? "bg-[#00E5A0]/15 text-[#00E5A0] border border-[#00E5A0]/30"
                        : "text-white/40 hover:text-white/75 border border-transparent"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="mt-2 h-[72px] w-full" dir="ltr" aria-hidden="true">
                <svg viewBox="0 0 560 110" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                  <defs>
                    <linearGradient id="heroAreaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00E5A0" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#00E5A0" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={areaPath} fill="url(#heroAreaFill)" />
                  <path d={path} fill="none" stroke="#00E5A0" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="560" cy={lastY} r="4" fill="#00E5A0" className="drop-shadow-[0_0_6px_rgba(0,229,160,0.9)]" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- Mobile floating asset cluster (right of the headline) ---------------- */

const CLUSTER_ASSETS = [
  { glyph: "Ξ", gradient: "from-[#8ea8f5] to-[#4462c8]", label: "Ethereum", pos: "top-[12px] end-[24px]", float: 4.6, delay: 0.55 },
  { glyph: "₮", gradient: "from-[#4fd1a5] to-[#127a55]", label: "USDT/Tether", pos: "top-[102px] end-[106px]", float: 5.4, delay: 0.75 },
  { glyph: "A", gradient: "from-[#4fd1a5] to-[#0e7a4f]", label: "Aramco", pos: "top-[150px] end-[60px]", float: 5.0, delay: 0.95 },
  { glyph: "S", gradient: "from-[#6ec2e0] to-[#1a6a8f]", label: "Salek", pos: "top-[178px] end-[8px]", float: 5.8, delay: 1.15 },
];

function FloatingCluster() {
  return (
    <div className="lg:hidden pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      {/* main Bitcoin coin — kept exactly where the client pointed */}
      <motion.div
        dir="ltr"
        className="absolute end-0 top-12"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
        transition={{
          opacity: { duration: 0.7, delay: 0.35, ease: "easeOut" },
          scale: { duration: 0.7, delay: 0.35, ease: "easeOut" },
          y: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.35 },
        }}
      >
        <div className="relative flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
          {/* soft halo */}
          <div className="absolute inset-0 rounded-full bg-[#00E5A0]/[0.1] blur-2xl" />
          {/* dashed orbit halo, like the globe coin */}
          <div className="absolute inset-0 rounded-full border border-dashed border-[#00E5A0]/30" />
          {/* coin face */}
          <div
            className="relative flex h-[74%] w-[74%] items-center justify-center rounded-full border-2 border-[#00E5A0] shadow-[0_0_34px_-4px_rgba(0,229,160,0.55),inset_0_0_18px_rgba(0,229,160,0.14)]"
            style={{ background: "radial-gradient(circle at 35% 28%, #134234, #0a2b21 60%, #06180f)" }}
          >
            <div className="absolute inset-[10%] rounded-full border border-[#00E5A0]/30" />
            <span className="text-[40px] sm:text-[46px] font-extrabold leading-none text-[#2cf0b5] drop-shadow-[0_0_16px_rgba(44,240,181,0.6)]">
              ₿
            </span>
          </div>
          {/* sparkle dots */}
          <span className="absolute -start-1 top-6 h-1.5 w-1.5 rounded-full bg-[#2cf0b5]/80 animate-pulse" />
          <span className="absolute -end-1.5 bottom-8 h-1 w-1 rounded-full bg-[#2cf0b5]/60 animate-pulse [animation-delay:1.2s]" />
        </div>
      </motion.div>

      {/* satellite assets — Ethereum, USDT/Tether, Aramco, Salek (exact client naming) */}
      {CLUSTER_ASSETS.map((a) => (
        <motion.div
          key={a.label}
          className={cn("absolute flex flex-col items-center", a.pos)}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
          transition={{
            opacity: { duration: 0.5, delay: a.delay, ease: "easeOut" },
            scale: { duration: 0.5, delay: a.delay, ease: "easeOut" },
            y: { duration: a.float, repeat: Infinity, ease: "easeInOut", delay: a.delay },
          }}
        >
          <CoinBadge
            glyph={a.glyph}
            gradient={a.gradient}
            className="h-8 w-8 text-[13px] ring-1 ring-white/20 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.75)]"
          />
          <span
            dir="ltr"
            className="mt-0.5 whitespace-nowrap rounded-full border border-white/10 bg-[#04121c]/85 px-1.5 py-px text-[8px] font-semibold leading-tight text-white/65"
          >
            {a.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ---------------- Globe + coin visual (drawn from scratch) ---------------- */

function GlobeVisual() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 rounded-full bg-[#00E5A0]/[0.08] blur-[90px]" aria-hidden="true" />
      <svg viewBox="0 0 480 440" className="relative w-full h-auto" aria-hidden="true">
        <defs>
          <radialGradient id="globeBody" cx="38%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#0f3d30" />
            <stop offset="55%" stopColor="#0a2b21" />
            <stop offset="100%" stopColor="#051711" />
          </radialGradient>
          <radialGradient id="coinFace" cx="35%" cy="28%" r="85%">
            <stop offset="0%" stopColor="#134234" />
            <stop offset="60%" stopColor="#0a2b21" />
            <stop offset="100%" stopColor="#06180f" />
          </radialGradient>
          <linearGradient id="orbitGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00E5A0" stopOpacity="0" />
            <stop offset="45%" stopColor="#00E5A0" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#00E5A0" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="coneGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#00E5A0" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#00E5A0" stopOpacity="0" />
          </linearGradient>
          <filter id="softGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* globe sphere + graticule */}
        <circle cx="240" cy="185" r="150" fill="url(#globeBody)" stroke="#00E5A0" strokeOpacity="0.18" />
        <g fill="none" stroke="#00E5A0">
          <ellipse cx="240" cy="185" rx="150" ry="54" strokeOpacity="0.13" />
          <ellipse cx="240" cy="185" rx="150" ry="104" strokeOpacity="0.09" />
          <ellipse cx="240" cy="185" rx="54" ry="150" strokeOpacity="0.13" />
          <ellipse cx="240" cy="185" rx="104" ry="150" strokeOpacity="0.09" />
          <path d="M90,185 H390" strokeOpacity="0.13" />
        </g>
        {/* dotted landmass hints */}
        <g fill="#00E5A0" opacity="0.16">
          <circle cx="185" cy="130" r="1.6" /><circle cx="205" cy="122" r="1.2" /><circle cx="222" cy="136" r="1.4" />
          <circle cx="285" cy="215" r="1.6" /><circle cx="300" cy="228" r="1.2" /><circle cx="270" cy="232" r="1.2" />
          <circle cx="160" cy="230" r="1.4" /><circle cx="320" cy="150" r="1.4" /><circle cx="338" cy="162" r="1.1" />
          <circle cx="240" cy="90" r="1.2" /><circle cx="255" cy="80" r="1.4" /><circle cx="205" cy="250" r="1.3" />
        </g>

        {/* orbit rings */}
        <g transform="rotate(-14 240 210)">
          <ellipse cx="240" cy="210" rx="222" ry="64" fill="none" stroke="url(#orbitGrad)" strokeWidth="1.6" />
          <ellipse cx="240" cy="210" rx="180" ry="42" fill="none" stroke="#00E5A0" strokeOpacity="0.14" />
          <motion.circle
            cx="462"
            cy="210"
            r="4.5"
            fill="#2cf0b5"
            filter="url(#softGlow)"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </g>

        {/* light cone from podium to coin */}
        <polygon points="170,330 310,330 272,205 208,205" fill="url(#coneGrad)" />

        {/* podium */}
        <g>
          <path d="M152,322 v22 a88,20 0 0 0 176,0 v-22" fill="#07211a" stroke="#00E5A0" strokeOpacity="0.2" />
          <ellipse cx="240" cy="322" rx="88" ry="20" fill="#0a2b21" stroke="#00E5A0" strokeOpacity="0.4" />
          <ellipse cx="240" cy="322" rx="60" ry="13" fill="none" stroke="#00E5A0" strokeOpacity="0.35" strokeDasharray="3 5" />
        </g>

        {/* floating BTC coin */}
        <motion.g
          animate={{ y: [0, -9, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <circle cx="240" cy="150" r="76" fill="none" stroke="#00E5A0" strokeOpacity="0.22" strokeDasharray="2 7" />
          <circle cx="240" cy="150" r="64" fill="url(#coinFace)" stroke="#00E5A0" strokeWidth="2" filter="url(#softGlow)" />
          <circle cx="240" cy="150" r="52" fill="none" stroke="#00E5A0" strokeOpacity="0.3" />
          <text
            x="240"
            y="152"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="58"
            fontWeight="800"
            fill="#2cf0b5"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            ₿
          </text>
        </motion.g>

        {/* sparkles */}
        <g fill="#2cf0b5">
          <motion.circle
            cx="105" cy="95" r="2"
            animate={{ opacity: [0.15, 0.9, 0.15] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.4 }}
          />
          <motion.circle
            cx="395" cy="120" r="2.4"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 3.6, repeat: Infinity, delay: 1.1 }}
          />
          <motion.circle
            cx="365" cy="300" r="1.8"
            animate={{ opacity: [0.15, 0.8, 0.15] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: 1.8 }}
          />
          <motion.circle
            cx="130" cy="285" r="1.8"
            animate={{ opacity: [0.1, 0.7, 0.1] }}
            transition={{ duration: 3.2, repeat: Infinity, delay: 0.9 }}
          />
        </g>
      </svg>
    </div>
  );
}

/* ---------------- Brand strip (CRYPTOWISE · TRADE · INVEST · GROW) ---------------- */

export function TaglineStrip({ t, lang }: { t: (k: StringKey) => string; lang: Lang }) {
  const brand = lang === "ar" ? "كريبتو وايز" : "CryptoWise";
  return (
    <div className="relative overflow-hidden border-y border-white/[0.04] bg-[#020b12]/60">
      {/* decorative topographic waves like the design footer */}
      <svg
        className="pointer-events-none absolute inset-x-0 -bottom-1 h-24 w-full"
        viewBox="0 0 1200 96"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0,72 C240,40 420,88 620,64 C820,40 1000,84 1200,56" fill="none" stroke="#00E5A0" strokeOpacity="0.08" />
        <path d="M0,84 C260,56 440,96 640,76 C840,56 1020,94 1200,70" fill="none" stroke="#00E5A0" strokeOpacity="0.05" />
      </svg>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-7 flex items-center gap-4">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/15" aria-hidden="true" />
        <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.35em] text-white/35" dir="ltr">
          {lang === "ar" ? (
            <span dir="rtl">
              {brand} <span className="text-[#00E5A0]/50">·</span> {t("tagline")}
            </span>
          ) : (
            <>
              {brand} <span className="text-[#00E5A0]/50">·</span> {t("tagline")}
            </>
          )}
        </p>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/15" aria-hidden="true" />
      </div>
    </div>
  );
}
