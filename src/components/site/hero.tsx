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

  // Trust chips + CTA pair are rendered in TWO placements: inside the copy column
  // on desktop (xl+, approved layout) and as a full-width row under the two-column
  // hero on tablet/mobile. One source of truth, no drift between the two.
  const trustChips = (
    <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
      {[
        { icon: BadgePercent, label: t("lowFees") },
        { icon: ShieldCheck, label: t("secureRegulated") },
        { icon: Clock3, label: t("support247") },
      ].map(({ icon: Icon, label }) => (
        <span key={label} className="inline-flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#00E5A0]/35 bg-[#00E5A0]/[0.06] text-[#00E5A0]">
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-[0.84375rem] font-semibold text-white/80">{label}</span>
        </span>
      ))}
    </div>
  );

  const ctaRow = (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={onLogin}
        className="group inline-flex items-center gap-2 rounded-full bg-[#00E5A0] px-7 py-3 text-[0.90625rem] font-bold text-[#022c20] shadow-[0_8px_36px_-8px_rgba(0,229,160,0.65)] hover:bg-[#2cf0b5] active:scale-[0.98] transition-all"
      >
        {t("signIn")}
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
      </button>
      <button
        onClick={onLogin}
        className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] px-7 py-3 text-[0.90625rem] font-semibold text-white/85 hover:bg-white/[0.08] hover:border-white/20 transition-colors"
      >
        {t("login")}
      </button>
    </div>
  );

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

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-12 sm:pt-16 xl:pt-20 pb-8">
        {/* TWO responsive columns at EVERY breakpoint — TEXT on one side, CRYPTO on
            the other (grid mirrors them automatically in RTL). Desktop (xl+) uses
            the approved grand 50/50 split; tablet/mobile shrink the crypto column
            so the composition sits BESIDE the copy, never above it. */}
        <div className="grid grid-cols-[1.1fr_0.9fr] sm:grid-cols-[1.2fr_0.8fr] xl:grid-cols-2 items-center xl:items-start gap-4 sm:gap-5 xl:gap-6">
          {/* LEFT column — badge, headline, description; chips + CTAs join it on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative isolate min-w-0"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#00E5A0]/25 bg-[#00d9b316] px-3 py-1.5 text-[0.65625rem] font-medium text-[#00E5A0] sm:px-4 sm:text-[0.78125rem]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00E5A0] animate-pulse" />
              {t("heroBadge")}
            </span>

            <h1 className="mt-4 text-[1.75rem] sm:mt-5 sm:text-4xl lg:text-5xl xl:text-[4rem] font-bold tracking-tight text-white leading-[1.04]">
              {t("heroTitle1")}
              <span className="block text-[#00E5A0] drop-shadow-[0_0_28px_rgba(0,229,160,0.35)]">
                {t("heroTitle2")}
              </span>
            </h1>

            <p className="mt-3 max-w-lg text-[0.875rem] sm:mt-5 sm:text-[0.96875rem] leading-relaxed text-white/60">
              {t("heroSub")}
            </p>

            {/* desktop: chips + CTAs stay inside the copy column (approved layout) */}
            <div className="mt-7 hidden xl:block">
              {trustChips}
              <div className="mt-8">{ctaRow}</div>
            </div>
          </motion.div>

          {/* RIGHT column — one coherent premium crypto illustration: a LARGE metallic
              gold 3D Bitcoin with 3D official-logo coins minted around it. A true
              responsive grid COLUMN beside the copy at every breakpoint: grand on
              desktop (xl+), substantially smaller on tablet/mobile where the fr-based
              column + SVG viewBox + %-positioned satellites scale the whole cluster
              down proportionally (no CSS zoom, no transform:scale, nothing absolutely
              positioned above the text). */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
            className="relative w-full xl:mx-auto xl:max-w-[520px] xl:-mt-2"
            dir="ltr"
          >
            <CryptoScene />
            <HeroSatellites />
          </motion.div>

          {/* tablet/mobile: chips + CTAs as a full-width row under the two columns */}
          <div className="col-span-2 xl:hidden">
            {trustChips}
            <div className="mt-6">{ctaRow}</div>
          </div>
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
                <p className="text-[0.8125rem] font-bold text-white">{btc.symbol}</p>
                <p className="text-[0.71875rem] text-white/40">{btc.name}</p>
                <p className="mt-1.5 font-mono text-[1.625rem] leading-none font-bold text-white tabular-nums">
                  {formatPrice(btc.price)}
                </p>
              </div>
              <span
                dir="ltr"
                className={cn(
                  "ms-auto lg:ms-4 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 font-mono text-[0.78125rem] font-bold tabular-nums",
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
                      "rounded-full px-3 py-1 font-mono text-[0.6875rem] font-bold transition-colors",
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

/* ------------------------------------------------------------------ */
/*  Premium crypto composition — LARGE metallic-gold 3D Bitcoin coin   */
/*  surrounded by 3D official-logo coins (client reference style).     */
/*  One coherent illustration: shared top-left light source, metallic  */
/*  rims, minted faces, orbit rings and depth shadows — NOT flat       */
/*  icons floating randomly.                                           */
/* ------------------------------------------------------------------ */

// Official Bitcoin "B" glyph — the white path of the official bitcoin.svg mark
// (public/logos/bitcoin.svg, viewBox 0 0 4091.27 4091.73), reused verbatim.
const BTC_B_PATH =
  "M2947.77 1754.38c40.72,-272.26 -166.56,-418.61 -450,-516.24l91.95 -368.8 -224.5 -55.94 -89.51 359.09c-59.02,-14.72 -119.63,-28.59 -179.87,-42.34l90.16 -361.46 -224.36 -55.94 -92 368.68c-48.84,-11.12 -96.81,-22.11 -143.35,-33.69l0.26 -1.16 -309.59 -77.31 -59.72 239.78c0,0 166.56,38.18 163.05,40.53 90.91,22.69 107.35,82.87 104.62,130.57l-104.74 420.15c6.26,1.59 14.38,3.89 23.34,7.49 -7.49,-1.86 -15.46,-3.89 -23.73,-5.87l-146.81 588.57c-11.11,27.62 -39.31,69.07 -102.87,53.33 2.25,3.26 -163.17,-40.72 -163.17,-40.72l-111.46 256.98 292.15 72.83c54.35,13.63 107.61,27.89 160.06,41.3l-92.9 373.03 224.24 55.94 92 -369.07c61.26,16.63 120.71,31.97 178.91,46.43l-91.69 367.33 224.51 55.94 92.89 -372.33c382.82,72.45 670.67,43.24 791.83,-303.02 97.63,-278.78 -4.86,-439.58 -206.26,-544.44 146.69,-33.83 257.18,-130.31 286.64,-329.61l-0.07 -0.05zm-512.93 719.26c-69.38,278.78 -538.76,128.08 -690.94,90.29l123.28 -494.2c152.17,37.99 640.17,113.17 567.67,403.91zm69.43 -723.3c-63.29,253.58 -453.96,124.75 -580.69,93.16l111.77 -448.21c126.73,31.59 534.85,90.55 468.94,355.05l-0.02 0z";

// Four-point sparkle star (reused at different scales/positions).
const SPARK_PATH =
  "M0,-16 C1.8,-4.5 4.5,-1.8 16,0 C4.5,1.8 1.8,4.5 0,16 C-1.8,4.5 -4.5,1.8 -16,0 C-4.5,-1.8 -1.8,-4.5 0,-16 Z";

type Satellite = {
  logo: string;
  pos: string;
  size: string;
  rim: string; // metallic coin-edge gradient
  face: string; // minted coin-face gradient (brand colour)
  imgClass: string;
  float: number;
  delay: number;
};

// Premium 3D mini-coins orbiting the Bitcoin — official brand marks only
// (public/logos). Positions/sizes are % of the square composition, so the
// cluster scales fluidly on every viewport (no scale hacks, no overflow,
// no clipping: max extents stay inside the 560×560 box).
const SATELLITES: Satellite[] = [
  {
    logo: "/logos/ethereum.svg",
    pos: "left-[7%] top-[4%]",
    size: "21%",
    rim: "linear-gradient(135deg,#FBFDFF 0%,#C9D2DE 28%,#7E8A9C 55%,#EEF3F9 80%,#93A0B2 100%)",
    face: "linear-gradient(145deg,#9CA8BE 0%,#5E6A82 48%,#313B4F 100%)",
    imgClass: "h-[56%] w-auto",
    float: 5.2,
    delay: 0.5,
  },
  {
    logo: "/logos/tether.svg",
    pos: "right-[5%] top-[9%]",
    size: "19%",
    rim: "linear-gradient(135deg,#EAFFF7 0%,#A2E9D0 30%,#3F9D7D 55%,#C2F4E0 80%,#5FB093 100%)",
    face: "linear-gradient(145deg,#41C69B 0%,#26A17B 50%,#116E52 100%)",
    imgClass: "w-[58%] h-auto",
    float: 6.0,
    delay: 0.8,
  },
  {
    logo: "/logos/aramco.svg",
    pos: "left-[2%] top-[47%]",
    size: "17.5%",
    rim: "linear-gradient(135deg,#FFF7DC 0%,#FFDF7E 30%,#C08A18 55%,#FFE9A8 80%,#A8700E 100%)",
    face: "linear-gradient(145deg,#FFFFFF 0%,#EDF3F7 55%,#CFDEE6 100%)",
    imgClass: "h-[76%] w-auto",
    float: 5.6,
    delay: 1.0,
  },
  {
    logo: "/logos/solana.svg",
    pos: "right-[7%] bottom-[8%]",
    size: "21%",
    rim: "linear-gradient(135deg,#C2FFEC 0%,#00FFA3 26%,#7FA6E8 52%,#C86BFF 76%,#DC1FFF 92%,#9A2BC4 100%)",
    face: "linear-gradient(145deg,#252933 0%,#13161C 55%,#0A0C10 100%)",
    imgClass: "w-[56%] h-auto",
    float: 6.4,
    delay: 1.2,
  },
  {
    logo: "/logos/salik.svg",
    pos: "left-[15%] bottom-[3%]",
    size: "15.5%",
    rim: "linear-gradient(135deg,#FFF7DC 0%,#FFDF7E 30%,#C08A18 55%,#FFE9A8 80%,#A8700E 100%)",
    face: "linear-gradient(145deg,#FFFFFF 0%,#F4F6F8 55%,#DDE3E8 100%)",
    imgClass: "w-[58%] h-auto",
    float: 5.0,
    delay: 1.4,
  },
];

function HeroSatellites() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
      {SATELLITES.map((s) => (
        <motion.div
          key={s.logo}
          className={cn("absolute", s.pos)}
          style={{ width: s.size }}
          initial={{ opacity: 0, scale: 0.55, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: [0, -7, 0] }}
          transition={{
            opacity: { duration: 0.55, delay: s.delay, ease: "easeOut" },
            scale: { duration: 0.55, delay: s.delay, ease: "easeOut" },
            y: { duration: s.float, repeat: Infinity, ease: "easeInOut", delay: s.delay },
          }}
        >
          {/* metallic rim */}
          <div
            className="relative aspect-square w-full rounded-full"
            style={{
              background: s.rim,
              boxShadow: "0 18px 38px -10px rgba(0,0,0,0.75), 0 2px 8px rgba(0,0,0,0.45)",
            }}
          >
            {/* minted brand face */}
            <div
              className="absolute inset-[6.5%] overflow-hidden rounded-full"
              style={{
                background: s.face,
                boxShadow: "inset 0 2px 4px rgba(255,255,255,0.35), inset 0 -6px 12px rgba(0,0,0,0.4)",
              }}
            >
              <img
                src={s.logo}
                alt=""
                loading="lazy"
                draggable={false}
                className={cn("absolute inset-0 m-auto", s.imgClass)}
              />
              {/* glass shine (top-left light) + lower shading = 3D coin lighting */}
              <span className="absolute inset-0 rounded-full bg-[radial-gradient(120%_120%_at_28%_16%,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.14)_30%,transparent_50%)]" />
              <span className="absolute inset-0 rounded-full bg-[linear-gradient(200deg,transparent_58%,rgba(0,0,0,0.3)_100%)]" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ---------------- Large metallic-gold Bitcoin scene ---------------- */

function CryptoScene() {
  return (
    <div className="relative">
      {/* warm stage glow behind the whole composition */}
      <div
        className="pointer-events-none absolute inset-[-10%] blur-2xl"
        style={{
          background:
            "radial-gradient(46% 46% at 52% 44%, rgba(247,183,51,0.20) 0%, rgba(0,229,160,0.06) 55%, transparent 78%)",
        }}
        aria-hidden="true"
      />
      <svg viewBox="0 0 560 560" className="relative h-auto w-full" aria-hidden="true">
        <defs>
          <radialGradient id="btcFace" cx="36%" cy="28%" r="88%">
            <stop offset="0%" stopColor="#FFFBE6" />
            <stop offset="25%" stopColor="#FFE9A8" />
            <stop offset="52%" stopColor="#FFD34E" />
            <stop offset="78%" stopColor="#EFA81C" />
            <stop offset="100%" stopColor="#C6810C" />
          </radialGradient>
          <radialGradient id="btcFaceShade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6B4405" stopOpacity="0" />
            <stop offset="62%" stopColor="#6B4405" stopOpacity="0" />
            <stop offset="100%" stopColor="#6B4405" stopOpacity="0.4" />
          </radialGradient>
          <linearGradient id="btcRim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF7DC" />
            <stop offset="20%" stopColor="#FFDF7E" />
            <stop offset="45%" stopColor="#D99A17" />
            <stop offset="62%" stopColor="#8A5A12" />
            <stop offset="82%" stopColor="#FFD977" />
            <stop offset="100%" stopColor="#A8700E" />
          </linearGradient>
          <linearGradient id="btcEdge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8A317" />
            <stop offset="45%" stopColor="#B9770E" />
            <stop offset="100%" stopColor="#6E4B06" />
          </linearGradient>
          <linearGradient id="btcGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFBE6" />
            <stop offset="22%" stopColor="#FFE89A" />
            <stop offset="50%" stopColor="#F7B733" />
            <stop offset="75%" stopColor="#DE9A12" />
            <stop offset="100%" stopColor="#B9770E" />
          </linearGradient>
          <linearGradient id="orbitGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F7B733" stopOpacity="0" />
            <stop offset="40%" stopColor="#F7B733" stopOpacity="0.55" />
            <stop offset="70%" stopColor="#00E5A0" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00E5A0" stopOpacity="0" />
          </linearGradient>
          <filter id="blurBig" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
          <filter id="blurMid" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <filter id="blurSm" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* warm halo + cool counter-glow */}
        <circle cx="284" cy="276" r="212" fill="#F7B733" opacity="0.2" filter="url(#blurBig)" />
        <circle cx="140" cy="446" r="86" fill="#00E5A0" opacity="0.07" filter="url(#blurBig)" />

        {/* orbit rings tying the cluster into one system */}
        <g transform="rotate(-14 280 280)">
          <ellipse cx="280" cy="280" rx="266" ry="94" fill="none" stroke="url(#orbitGrad)" strokeWidth="1.5" />
          <ellipse cx="280" cy="280" rx="238" ry="76" fill="none" stroke="#F7B733" strokeOpacity="0.16" strokeWidth="1.4" strokeDasharray="2 9" />
          <motion.circle
            cx="46"
            cy="280"
            r="4"
            fill="#F7B733"
            filter="url(#blurSm)"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </g>
        <g transform="rotate(22 280 280)">
          <ellipse cx="280" cy="280" rx="250" ry="128" fill="none" stroke="#00E5A0" strokeOpacity="0.1" strokeWidth="1.2" />
          <motion.circle
            cx="530"
            cy="280"
            r="3.6"
            fill="#2cf0b5"
            filter="url(#blurSm)"
            animate={{ opacity: [0.35, 0.95, 0.35] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
          />
        </g>

        {/* two small distant gold coins on the orbits — depth */}
        <motion.g
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        >
          <circle cx="96" cy="150" r="13" fill="url(#btcFace)" stroke="url(#btcRim)" strokeWidth="3" />
          <circle cx="96" cy="150" r="7.5" fill="none" stroke="#B9770E" strokeOpacity="0.55" strokeWidth="1.2" />
        </motion.g>
        <motion.g
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
        >
          <circle cx="486" cy="390" r="10" fill="url(#btcFace)" stroke="url(#btcRim)" strokeWidth="2.6" />
          <circle cx="486" cy="390" r="5.5" fill="none" stroke="#B9770E" strokeOpacity="0.55" strokeWidth="1" />
        </motion.g>

        {/* ===== THE Bitcoin — dominant, metallic gold, 3D ===== */}
        <motion.g
          animate={{ y: [0, -11, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* coin edge (thickness) + reeded milling */}
          <circle cx="280" cy="293" r="178" fill="url(#btcEdge)" />
          <circle cx="280" cy="293" r="178" fill="none" stroke="#6E4B06" strokeWidth="9" strokeDasharray="3.2 5.6" opacity="0.5" />
          {/* face + metallic rim */}
          <circle cx="280" cy="278" r="178" fill="url(#btcFace)" />
          <circle cx="280" cy="278" r="178" fill="none" stroke="url(#btcRim)" strokeWidth="9" />
          <circle cx="280" cy="278" r="184.5" fill="none" stroke="#FFF7DC" strokeOpacity="0.32" strokeWidth="1.3" />
          {/* face milling + engraved rings */}
          <circle cx="280" cy="278" r="163" fill="none" stroke="#C98A0F" strokeWidth="6" strokeDasharray="2 7.4" opacity="0.3" />
          <circle cx="280" cy="278" r="152" fill="none" stroke="#B9770E" strokeOpacity="0.55" strokeWidth="2.2" />
          <circle cx="280" cy="278" r="146" fill="none" stroke="#FFF3C4" strokeOpacity="0.32" strokeWidth="1.4" />
          <circle cx="280" cy="278" r="170" fill="url(#btcFaceShade)" />
          {/* official Bitcoin B — embossed relief layer + metallic gold face */}
          <g transform="translate(281 285) scale(0.092) translate(-2045.64 -2045.87)">
            <path d={BTC_B_PATH} fill="#7A5407" opacity="0.55" />
          </g>
          <g transform="translate(280 278) scale(0.092) translate(-2045.64 -2045.87)">
            <path d={BTC_B_PATH} fill="url(#btcGold)" stroke="#8A5A12" strokeWidth="14" strokeOpacity="0.28" />
          </g>
          {/* specular highlights */}
          <path
            d="M163.6,180.3 A152,152 0 0 1 367.2,153.5"
            fill="none"
            stroke="#FFFEF5"
            strokeOpacity="0.5"
            strokeWidth="11"
            strokeLinecap="round"
            filter="url(#blurMid)"
          />
          <path
            d="M396.4,375.7 A152,152 0 0 1 319.3,424.9"
            fill="none"
            stroke="#FFD977"
            strokeOpacity="0.18"
            strokeWidth="7"
            strokeLinecap="round"
            filter="url(#blurMid)"
          />
        </motion.g>

        {/* sparkles */}
        <g fill="#FFE89A">
          <motion.path
            d={SPARK_PATH}
            transform="translate(296 46) scale(0.9)"
            animate={{ opacity: [0.25, 0.95, 0.25] }}
            transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          <motion.path
            d={SPARK_PATH}
            transform="translate(206 74) scale(0.5)"
            animate={{ opacity: [0.2, 0.85, 0.2] }}
            transition={{ duration: 2.7, repeat: Infinity, ease: "easeInOut", delay: 1.3 }}
          />
          <motion.path
            d={SPARK_PATH}
            transform="translate(60 400) scale(0.7)"
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
          />
        </g>
        <g fill="#2cf0b5">
          <motion.path
            d={SPARK_PATH}
            transform="translate(486 250) scale(0.55)"
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 3.3, repeat: Infinity, ease: "easeInOut", delay: 1.7 }}
          />
          <motion.path
            d={SPARK_PATH}
            transform="translate(322 516) scale(0.6)"
            animate={{ opacity: [0.15, 0.75, 0.15] }}
            transition={{ duration: 2.9, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
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
        <p className="whitespace-nowrap text-[0.625rem] font-semibold uppercase tracking-[0.35em] text-white/35" dir="ltr">
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
