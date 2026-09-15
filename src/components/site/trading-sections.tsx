"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, Headset, Globe2, ArrowDownUp, CheckCircle2, RefreshCcw } from "lucide-react";
import { CoinBadge } from "./icons";
import { formatPrice, type Coin } from "@/lib/market";
import type { StringKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ---------------- Infrastructure ---------------- */

export function Infrastructure({ t, onRegister, onLogin }: { t: (k: StringKey) => string; onRegister: () => void; onLogin: () => void }) {
  const badges = [
    { icon: ShieldCheck, label: t("secureRegulated") },
    { icon: Zap, label: t("fastTransactions") },
    { icon: Headset, label: t("support247") },
    { icon: Globe2, label: t("globalAccess") },
  ];
  return (
    <section id="investing" className="scroll-mt-20 border-y border-white/[0.05] bg-[#020b12]/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[12.5px] font-semibold uppercase tracking-[0.18em] text-[#00E5A0]">
              {t("infraBadge")}
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              {t("infraTitle1")}{" "}
              <span className="bg-gradient-to-r from-[#00E5A0] to-teal-300 bg-clip-text text-transparent">
                {t("infraTitle2")}
              </span>
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">{t("infraSub")}</p>

            <div className="mt-6 grid grid-cols-2 gap-3 max-w-md">
              {badges.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-[13px] font-medium text-white/75"
                >
                  <Icon className="h-4 w-4 shrink-0 text-[#00E5A0]" />
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={onRegister}
                className="rounded-xl bg-[#00E5A0] px-6 py-3 text-[14.5px] font-bold text-[#022c20] shadow-[0_8px_32px_-8px_rgba(0,229,160,0.6)] hover:bg-[#2cf0b5] active:scale-[0.98] transition-all"
              >
                {t("getStarted")}
              </button>
              <button
                onClick={onLogin}
                className="rounded-xl border border-white/12 bg-white/[0.04] px-6 py-3 text-[14.5px] font-semibold text-white/85 hover:bg-white/[0.08] transition-colors"
              >
                {t("login")}
              </button>
            </div>
          </motion.div>

          {/* trust cards */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="grid sm:grid-cols-3 gap-4"
          >
            <div className="sm:col-span-2 rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#0d4638] to-[#0a382e] p-6 flex flex-col justify-between min-h-[150px]">
              <ShieldCheck className="h-7 w-7 text-[#00E5A0]" />
              <p className="mt-6 text-xl sm:text-2xl font-bold text-white leading-snug">
                {t("bankLevel")} <br className="hidden sm:block" /> {t("bankLevel2")}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 flex flex-col justify-between min-h-[150px]">
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#00E5A0]/70">100%</span>
              <p className="text-base font-semibold text-white leading-snug">{t("yourFunds")}</p>
            </div>
            <div className="sm:col-span-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 flex items-center justify-between gap-4">
              <p className="text-base font-semibold text-white">{t("trusted")}</p>
              <div className="flex -space-x-2 rtl:space-x-reverse" aria-hidden="true">
                {["from-[#f6bd63] to-[#c96f0a]", "from-[#8ea8f5] to-[#4462c8]", "from-[#4fd1a5] to-[#127a55]", "from-[#b57bff] to-[#6b2bd9]"].map(
                  (g, i) => (
                    <span
                      key={i}
                      className={cn("h-8 w-8 rounded-full border-2 border-[#04121c] bg-gradient-to-br", g)}
                    />
                  )
                )}
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#04121c] bg-white/10 text-[10px] font-bold text-white/80">
                  +
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Trading / swap ---------------- */

export function TradingSection({
  t,
  coins,
  onLogin,
}: {
  t: (k: StringKey) => string;
  coins: Coin[];
  onLogin: () => void;
}) {
  const [sendIdx, setSendIdx] = useState(0); // BTC
  const [recvIdx, setRecvIdx] = useState(1); // ETH
  const [amount, setAmount] = useState("1");
  const [flipping, setFlipping] = useState(false);

  const send = coins[sendIdx];
  const recv = coins[recvIdx];
  const rate = recv.price > 0 ? send.price / recv.price : 0;
  const num = parseFloat(amount) || 0;
  const receive = num * rate;

  const swapOptions = useMemo(() => coins.slice(0, 4), [coins]);

  const flip = () => {
    setFlipping(true);
    setSendIdx(recvIdx);
    setRecvIdx(sendIdx);
    setTimeout(() => setFlipping(false), 350);
  };

  const features = [t("feat1"), t("feat2"), t("feat3")];

  return (
    <section id="trading" className="scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[12.5px] font-semibold uppercase tracking-[0.18em] text-[#00E5A0]">
              {t("tradingBadge")}
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              {t("tradingTitle")}
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">{t("tradingSub")}</p>
            <ul className="mt-6 flex flex-col gap-3">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-[14.5px] text-white/75">
                  <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#00E5A0]" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={onLogin}
              className="mt-8 inline-flex items-center rounded-xl bg-[#00E5A0] px-6 py-3 text-[14.5px] font-bold text-[#022c20] shadow-[0_8px_32px_-8px_rgba(0,229,160,0.6)] hover:bg-[#2cf0b5] active:scale-[0.98] transition-all"
            >
              {t("startTrading")}
            </button>
          </motion.div>

          {/* swap widget */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="pointer-events-none absolute -inset-5 rounded-[28px] bg-[#00E5A0]/[0.04] blur-2xl" aria-hidden="true" />
            <div className="relative rounded-2xl border border-white/[0.08] bg-[#071923]/90 p-5 sm:p-6 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.8)]" dir="ltr">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-semibold text-white">{t("swapCrypto")}</p>
                  <p className="text-[11.5px] font-medium text-[#00E5A0]">{t("liveRates")}</p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-white/60">
                  <ArrowDownUp className="h-4 w-4" />
                </span>
              </div>

              {/* you send */}
              <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-white/40">{t("youSend")}</p>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                    inputMode="decimal"
                    aria-label={t("youSend")}
                    className="min-w-0 flex-1 bg-transparent font-mono text-2xl font-bold text-white outline-none placeholder:text-white/25 tabular-nums"
                    placeholder="0.00"
                  />
                  <select
                    value={sendIdx}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setSendIdx(v);
                      if (v === recvIdx) setRecvIdx(sendIdx);
                    }}
                    aria-label="Send currency"
                    className="shrink-0 cursor-pointer rounded-lg border border-white/10 bg-[#04121c] px-2.5 py-2 text-sm font-semibold text-white outline-none hover:border-[#00E5A0]/40"
                  >
                    {swapOptions.map((c, i) => (
                      <option key={c.id} value={i}>
                        {c.symbol}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <CoinBadge glyph={send.glyph} gradient={send.gradient} className="h-4 w-4 text-[8px]" />
                  <span className="font-mono text-[11px] text-white/35">{send.name}</span>
                </div>
              </div>

              {/* flip */}
              <div className="relative z-10 -my-2.5 flex justify-center">
                <button
                  onClick={flip}
                  aria-label="Swap direction"
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border border-[#00E5A0]/30 bg-[#071923] text-[#00E5A0] shadow-lg transition-transform duration-300 hover:scale-110",
                    flipping && "rotate-180"
                  )}
                >
                  <RefreshCcw className="h-4 w-4" />
                </button>
              </div>

              {/* you receive */}
              <div className="rounded-xl border border-[#00E5A0]/20 bg-[#00e5a014] p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#00E5A0]/70">{t("youReceive")}</p>
                <div className="mt-2 flex items-center gap-3">
                  <p className="min-w-0 flex-1 truncate font-mono text-2xl font-bold text-white tabular-nums">
                    {receive > 0 ? `${t("approx")} ${receive.toFixed(receive >= 100 ? 4 : 6)}` : `${t("approx")} 0.00`}
                  </p>
                  <select
                    value={recvIdx}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setRecvIdx(v);
                      if (v === sendIdx) setSendIdx(recvIdx);
                    }}
                    aria-label="Receive currency"
                    className="shrink-0 cursor-pointer rounded-lg border border-white/10 bg-[#04121c] px-2.5 py-2 text-sm font-semibold text-white outline-none hover:border-[#00E5A0]/40"
                  >
                    {swapOptions.map((c, i) => (
                      <option key={c.id} value={i}>
                        {c.symbol}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <CoinBadge glyph={recv.glyph} gradient={recv.gradient} className="h-4 w-4 text-[8px]" />
                  <span className="font-mono text-[11px] text-white/35">{recv.name}</span>
                </div>
              </div>

              {/* details */}
              <div className="mt-5 flex flex-col gap-2.5 border-t border-white/[0.06] pt-4 text-[12.5px]">
                <div className="flex items-center justify-between">
                  <span className="text-white/45">{t("exchangeRate")}</span>
                  <span className="font-mono font-semibold text-white/85 tabular-nums" dir="ltr">
                    1 {send.symbol} ≈ {rate > 0 ? rate.toFixed(rate >= 100 ? 4 : 6) : "0"} {recv.symbol}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/45">{t("networkFee")}</span>
                  <span className="font-medium text-white/70">{t("feeValue")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/45">{t("estArrival")}</span>
                  <span className="font-medium text-white/70">{t("estValue")}</span>
                </div>
              </div>

              <button
                onClick={onLogin}
                className="mt-5 w-full rounded-xl bg-[#00E5A0] py-3.5 text-[14.5px] font-bold text-[#022c20] shadow-[0_8px_32px_-8px_rgba(0,229,160,0.55)] hover:bg-[#2cf0b5] active:scale-[0.99] transition-all"
              >
                {t("exchangeNow")}
              </button>
              <p className="mt-3 text-center text-[11.5px] text-white/35">{t("swapNote")}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Why choose us ---------------- */

export function WhyChooseUs({ t, onRegister }: { t: (k: StringKey) => string; onRegister: () => void }) {
  const cards = [
    { title: t("simpleExchange"), desc: t("simpleExchangeDesc"), glyph: "⇄" },
    { title: t("realTimeMarkets"), desc: t("realTimeMarketsDesc"), glyph: "◈" },
    { title: t("multiAsset"), desc: t("multiAssetDesc"), glyph: "◎" },
    { title: t("transactionTracking"), desc: t("transactionTrackingDesc"), glyph: "⌁" },
  ];
  return (
    <section className="border-y border-white/[0.05] bg-[#020b12]/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-[12.5px] font-semibold uppercase tracking-[0.18em] text-[#00E5A0]">{t("whyUs")}</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">{t("whyUsTitle")}</h2>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 hover:border-[#00E5A0]/25 hover:bg-[#00e5a014] transition-colors"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#00E5A0]/12 text-lg text-[#00E5A0]">
                {c.glyph}
              </span>
              <h3 className="mt-4 text-[16px] font-semibold text-white">{c.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/50">{c.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={onRegister}
            className="rounded-xl bg-[#00E5A0] px-8 py-3.5 text-[14.5px] font-bold text-[#022c20] shadow-[0_8px_32px_-8px_rgba(0,229,160,0.6)] hover:bg-[#2cf0b5] active:scale-[0.98] transition-all"
          >
            {t("getStarted")}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Three steps ---------------- */

export function Steps({ t, onRegister }: { t: (k: StringKey) => string; onRegister: () => void }) {
  const steps = [
    { n: "01", title: t("step1Title"), desc: t("step1Desc") },
    { n: "02", title: t("step2Title"), desc: t("step2Desc") },
    { n: "03", title: t("step3Title"), desc: t("step3Desc") },
  ];
  return (
    <section>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="text-center text-3xl sm:text-4xl font-bold tracking-tight text-white"
        >
          {t("stepsTitle")}
        </motion.h2>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="relative rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-transparent p-7"
            >
              <span className="font-mono text-[40px] font-bold leading-none text-[#00E5A0]/15 select-none" aria-hidden="true">
                {s.n}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-white">
                <span className="me-2 font-mono text-[13px] font-bold text-[#00E5A0]">{s.n}</span>
                {s.title}
              </h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-white/50">{s.desc}</p>
              {i < 2 && (
                <span className="absolute top-1/2 -end-4 lg:-end-6 hidden md:block h-px w-8 lg:w-12 bg-gradient-to-r from-[#00E5A0]/40 to-transparent" aria-hidden="true" />
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={onRegister}
            className="rounded-xl border border-[#00E5A0]/35 bg-[#00e5a014] px-8 py-3.5 text-[14.5px] font-bold text-[#00E5A0] hover:bg-[#00E5A0]/15 transition-colors"
          >
            {t("step1Title")}
          </button>
        </div>
      </div>
    </section>
  );
}
