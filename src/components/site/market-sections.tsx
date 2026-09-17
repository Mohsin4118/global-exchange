"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Globe2, Zap, TrendingUp, ArrowRight } from "lucide-react";
import { CoinBadge } from "./icons";
import { formatChange, formatPrice, type Coin } from "@/lib/market";
import type { StringKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ---------------- Feature row (design: outlined circle icons + dividers) ---------------- */

export function Pillars({ t }: { t: (k: StringKey) => string }) {
  const items = [
    { icon: Globe2, title: t("globalAccess"), desc: t("globalAccessDesc") },
    { icon: ShieldCheck, title: t("bankGrade"), desc: t("bankGradeDesc") },
    { icon: Zap, title: t("transparentFees"), desc: t("transparentFeesDesc") },
    { icon: TrendingUp, title: t("growPortfolio"), desc: t("growPortfolioDesc") },
  ];
  return (
    <section id="features" className="scroll-mt-20 border-t border-white/[0.04]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-9 gap-x-4">
          {items.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={cn(
                "px-0 sm:px-5 lg:px-6",
                i > 0 && "lg:border-s lg:border-white/[0.07]",
                i === 2 && "sm:border-s sm:border-white/[0.07] lg:border-s",
                i === 3 && "sm:border-s sm:border-white/[0.07] lg:border-s"
              )}
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#00E5A0]/40 bg-[#00E5A0]/[0.05] text-[#00E5A0]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-[15.5px] font-bold text-white">{title}</h3>
              <p className="mt-2 max-w-[240px] text-[13px] leading-relaxed text-white/50">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Ticker marquee ---------------- */

export function Ticker({ coins }: { coins: Coin[] }) {
  const doubled = [...coins, ...coins];
  return (
    <div className="relative overflow-hidden border-b border-white/[0.05] bg-[#020b12]/80" dir="ltr">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#04121c] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#04121c] to-transparent z-10" />
      <div className="flex w-max animate-[marquee_36s_linear_infinite] gap-10 py-3">
        {doubled.map((c, i) => (
          <span key={`${c.id}-${i}`} className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-mono text-[11.5px] font-bold text-white/50">{c.symbol}</span>
            <span className="font-mono text-[11.5px] font-semibold text-white/85 tabular-nums">
              {formatPrice(c.price)}
            </span>
            <span
              className={cn(
                "font-mono text-[11px] font-semibold tabular-nums",
                c.change24h >= 0 ? "text-emerald-400" : "text-amber-400"
              )}
            >
              {formatChange(c.change24h)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Stocks (Salek, Aramco — user-requested) ---------------- */

export function StocksSection({
  t,
  stocks,
  onRegister,
}: {
  t: (k: StringKey) => string;
  stocks: Coin[];
  onRegister: () => void;
}) {
  return (
    <section id="stocks" className="scroll-mt-20 border-t border-white/[0.04]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-[12.5px] font-semibold uppercase tracking-[0.18em] text-[#00E5A0]">
            {t("stocksBadge")}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">{t("stocksTitle")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-white/55">{t("stocksSub")}</p>
        </motion.div>

        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          {stocks.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="group rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-transparent p-5 hover:border-[#00E5A0]/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CoinBadge glyph={s.glyph} gradient={s.gradient} className="h-11 w-11 text-lg" />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-white">{s.name}</p>
                  <p className="font-mono text-[11px] text-white/40" dir="ltr">
                    {s.symbol} · {s.exchange}
                  </p>
                </div>
              </div>
              <p className="mt-4 font-mono text-2xl font-bold text-white tabular-nums">{formatPrice(s.price)}</p>
              <p
                className={cn(
                  "mt-0.5 font-mono text-[12.5px] font-semibold tabular-nums",
                  s.change24h >= 0 ? "text-emerald-400" : "text-amber-400"
                )}
              >
                <span dir="ltr">{formatChange(s.change24h)} (24h)</span>
              </p>
              <button
                onClick={onRegister}
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] py-2.5 text-[13px] font-semibold text-white/80 group-hover:border-[#00E5A0]/40 group-hover:text-[#00E5A0] transition-colors"
              >
                {t("getStarted")}
                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Live market ---------------- */

export function LiveMarket({
  t,
  coins,
  onRegister,
}: {
  t: (k: StringKey) => string;
  coins: Coin[];
  onRegister: () => void;
}) {
  const featured = [coins[0], coins[1], coins[3], coins[4]]; // BTC ETH SOL BNB
  return (
    <section id="markets" className="scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">{t("liveMarketTitle")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-white/55">{t("liveMarketSub")}</p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featured.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="group rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-transparent p-5 hover:border-[#00E5A0]/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CoinBadge glyph={c.glyph} gradient={c.gradient} className="h-11 w-11 text-lg" />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-white">{c.name}</p>
                  <p className="font-mono text-[11px] text-white/40">{c.symbol}</p>
                </div>
              </div>
              <p className="mt-4 font-mono text-2xl font-bold text-white tabular-nums">{formatPrice(c.price)}</p>
              <p
                className={cn(
                  "mt-0.5 font-mono text-[12.5px] font-semibold tabular-nums",
                  c.change24h >= 0 ? "text-emerald-400" : "text-amber-400"
                )}
              >
                <span dir="ltr">{formatChange(c.change24h)} (24h)</span>
              </p>
              <button
                onClick={onRegister}
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] py-2.5 text-[13px] font-semibold text-white/80 group-hover:border-[#00E5A0]/40 group-hover:text-[#00E5A0] transition-colors"
              >
                {t("getStarted")}
                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
