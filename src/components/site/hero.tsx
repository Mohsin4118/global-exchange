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
  onLogin,
}: {
  t: (k: StringKey) => string;
  coins: Coin[];
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
                onClick={onLogin}
                className="group inline-flex items-center gap-2 rounded-full bg-[#00E5A0] px-7 py-3 text-[14.5px] font-bold text-[#022c20] shadow-[0_8px_36px_-8px_rgba(0,229,160,0.65)] hover:bg-[#2cf0b5] active:scale-[0.98] transition-all"
              >
                {t("signIn")}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              </button>
              <button
                onClick={onLogin}
                className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] px-7 py-3 text-[14.5px] font-semibold text-white/85 hover:bg-white/[0.08] hover:border-white/20 transition-colors"
              >
                {t("login")}
              </button>
            </div>
          </motion.div>

          {/* right visual — glowing globe + enlarged GOLD Bitcoin coin + orbiting official logos.
              The graphic lives in its own grid cell (desktop) / below the copy (mobile),
              so it can never overlap the headline, description or buttons (client request). */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-[480px]"
            dir="ltr"
          >
            <GlobeVisual />
            <HeroSatellites />
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

/* ---------------- Orbiting official-logo satellites around the Bitcoin coin ---------------- */

// Official brand logo files (public/logos) — real marks, no generic glyphs (client request).
// Positioned with physical insets inside a dir="ltr" wrapper so they never mirror, never clip
// at the edges and never reach the hero copy (the visual is a separate grid cell / stacked
// below the text on mobile — rebuilt responsively, no CSS scale).
const SATELLITES = [
  { logo: "/logos/ethereum.svg", imgClass: "h-[62%] w-auto", label: "Ethereum", pos: "left-[16%] top-[5%]", float: 4.6, delay: 0.55 },
  { logo: "/logos/tether.svg", imgClass: "w-[64%] h-auto", label: "USDT/Tether", pos: "right-[16%] top-[8%]", float: 5.4, delay: 0.75 },
  { logo: "/logos/aramco.svg", imgClass: "h-[76%] w-[76%] rounded-full", label: "Aramco", pos: "left-[16%] top-[46%]", float: 5.0, delay: 0.95 },
  { logo: "/logos/salik.svg", imgClass: "w-[66%] h-auto", label: "Salek", pos: "right-[16%] top-[52%]", float: 5.8, delay: 1.15 },
];

function HeroSatellites() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
      {SATELLITES.map((a) => (
        <motion.div
          key={a.label}
          className={cn("absolute flex flex-col items-center", a.pos)}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1, y: [0, -7, 0] }}
          transition={{
            opacity: { duration: 0.5, delay: a.delay, ease: "easeOut" },
            scale: { duration: 0.5, delay: a.delay, ease: "easeOut" },
            y: { duration: a.float, repeat: Infinity, ease: "easeInOut", delay: a.delay },
          }}
        >
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-white/25 shadow-[0_10px_28px_-8px_rgba(0,0,0,0.8)] sm:h-12 sm:w-12">
            <img src={a.logo} alt="" aria-hidden="true" loading="lazy" className={a.imgClass} />
          </span>
          <span
            dir="ltr"
            className="mt-1 whitespace-nowrap rounded-full border border-white/10 bg-[#04121c]/90 px-1.5 py-px text-[8px] font-semibold leading-tight text-white/70"
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
            <stop offset="0%" stopColor="#F7B733" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#F7B733" stopOpacity="0" />
          </linearGradient>
          {/* metallic gold for the Bitcoin mark (client request: GOLD / METALLIC GOLD B) */}
          <linearGradient id="btcGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF7DC" />
            <stop offset="20%" stopColor="#FFE89A" />
            <stop offset="45%" stopColor="#F7B733" />
            <stop offset="70%" stopColor="#DE9A12" />
            <stop offset="100%" stopColor="#B9770E" />
          </linearGradient>
          <linearGradient id="coinRim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFE89A" />
            <stop offset="55%" stopColor="#E8A317" />
            <stop offset="100%" stopColor="#9C6A0B" />
          </linearGradient>
          <filter id="coinHalo" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
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
          <ellipse cx="240" cy="322" rx="60" ry="13" fill="none" stroke="#F7B733" strokeOpacity="0.45" strokeDasharray="3 5" />
        </g>

        {/* floating BTC coin — ENLARGED with a metallic GOLD “B” as the hero focus (client request) */}
        <motion.g
          animate={{ y: [0, -9, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* warm gold halo behind the coin */}
          <circle cx="240" cy="150" r="92" fill="#F7B733" opacity="0.16" filter="url(#coinHalo)" />
          {/* dashed mint orbit */}
          <circle cx="240" cy="150" r="102" fill="none" stroke="#00E5A0" strokeOpacity="0.22" strokeDasharray="2 7" />
          {/* coin face + gold rim */}
          <circle cx="240" cy="150" r="86" fill="url(#coinFace)" stroke="url(#coinRim)" strokeWidth="3.5" />
          {/* inner gold ring */}
          <circle cx="240" cy="150" r="70" fill="none" stroke="#F7B733" strokeOpacity="0.32" />
          {/* embossed depth layer */}
          <text
            x="240"
            y="155"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="124"
            fontWeight="800"
            fill="#7A5407"
            opacity="0.55"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            ₿
          </text>
          {/* metallic gold B — much larger, perfectly centered */}
          <text
            x="240"
            y="150"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="124"
            fontWeight="800"
            fill="url(#btcGold)"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            ₿
          </text>
          {/* specular highlight arc on the coin rim */}
          <path d="M192,108 A62,62 0 0 1 288,108" fill="none" stroke="#FFF7DC" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
        </motion.g>

        {/* sparkles — mint ambient + gold accents near the coin */}
        <g>
          <motion.circle
            cx="105" cy="95" r="2"
            fill="#2cf0b5"
            animate={{ opacity: [0.15, 0.9, 0.15] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.4 }}
          />
          <motion.circle
            cx="395" cy="120" r="2.4"
            fill="#2cf0b5"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 3.6, repeat: Infinity, delay: 1.1 }}
          />
          <motion.circle
            cx="365" cy="300" r="1.8"
            fill="#2cf0b5"
            animate={{ opacity: [0.15, 0.8, 0.15] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: 1.8 }}
          />
          <motion.circle
            cx="130" cy="285" r="1.8"
            fill="#2cf0b5"
            animate={{ opacity: [0.1, 0.7, 0.1] }}
            transition={{ duration: 3.2, repeat: Infinity, delay: 0.9 }}
          />
          <motion.circle
            cx="338" cy="64" r="2.4"
            fill="#F7B733"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 3.1, repeat: Infinity, delay: 0.6 }}
          />
          <motion.circle
            cx="148" cy="212" r="2"
            fill="#F7B733"
            animate={{ opacity: [0.15, 0.85, 0.15] }}
            transition={{ duration: 3.4, repeat: Infinity, delay: 1.4 }}
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
