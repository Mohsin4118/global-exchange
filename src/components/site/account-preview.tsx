"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Landmark, ReceiptText, ChevronDown } from "lucide-react";
import { ContactButtonsFloat } from "./contact-buttons";
import type { StringKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const WITHDRAW_STATES: { key: StringKey; cls: string }[] = [
  { key: "stYes", cls: "bg-emerald-100 text-emerald-700" },
  { key: "stNo", cls: "bg-slate-100 text-slate-600" },
  { key: "stVerification", cls: "bg-amber-100 text-amber-700" },
  { key: "stTax", cls: "bg-sky-100 text-sky-700" },
  { key: "stDocs", cls: "bg-orange-100 text-orange-700" },
  { key: "stFee", cls: "bg-violet-100 text-violet-700" },
];

/**
 * Client wallet preview implementing the client's requested modifications:
 *  1. Current Balance (kept as is)
 *  2. "Source" (replaces Performance)
 *  3. Total Transactions with "Available to withdrawal" status
 *     (Yes / No / Need verification / Tax check / Document missing / Transaction fee)
 * Mirrors the light wallet UI from the client's screenshots and fully flips RTL in Arabic.
 */
export function AccountPreview({ t }: { t: (k: StringKey) => string }) {
  const [stateIdx, setStateIdx] = useState(0);
  const state = WITHDRAW_STATES[stateIdx];

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-10 start-1/4 h-[360px] w-[360px] rounded-full bg-[#00E5A0]/[0.05] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[0.78125rem] font-semibold uppercase tracking-[0.18em] text-[#00E5A0]">
              {t("acctBadge")}
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              {t("acctTitle")}
            </h2>
            <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-white/55">{t("acctSub")}</p>
            <ul className="mt-6 flex flex-col gap-3 text-[0.90625rem] text-white/75">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00E5A0]" />
                {t("acctPoint1")}
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00E5A0]" />
                {t("acctPoint2")}
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00E5A0]" />
                {t("acctPoint3")}
              </li>
            </ul>
            <p className="mt-6 text-[0.75rem] text-white/35">{t("tapStatus")}</p>
          </motion.div>

          {/* wallet mockup (light, like client screenshots) */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="relative mx-auto w-full max-w-sm"
          >
            <div className="pointer-events-none absolute -inset-5 rounded-[32px] bg-[#00E5A0]/[0.05] blur-2xl" aria-hidden="true" />

            {/* floating contact buttons (like the client's app) — official WhatsApp / Telegram / imo marks */}
            <div className="absolute -top-3 -end-3 sm:-end-5 z-20">
              <ContactButtonsFloat size="sm" />
            </div>

            <div className="relative rounded-[28px] bg-[#eef6f1] p-4 sm:p-5 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.75)]">
              <p className="flex items-center gap-1 px-1 text-[0.78125rem] font-semibold text-slate-500">
                <span className="text-slate-400">—</span>
                {t("inOnePlace")}
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </p>

              {/* 1. Current balance — kept as-is per client */}
              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <div className="min-w-0">
                  <p className="text-[0.75rem] font-medium text-slate-400">{t("currentBalance")}</p>
                  <p className="mt-0.5 font-mono text-[1.375rem] font-bold tabular-nums text-slate-900" dir="ltr">
                    $0.00
                  </p>
                  <p className="text-[0.6875rem] text-slate-400">{t("availableFunds")}</p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-[0_6px_18px_-6px_rgba(16,185,129,0.7)]">
                  <Wallet className="h-4.5 w-4.5" />
                </span>
              </div>

              {/* 2. Source — replaces Performance per client */}
              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <div className="min-w-0">
                  <p className="text-[0.75rem] font-medium text-slate-400">{t("source")}</p>
                  <p className="mt-0.5 text-[1.125rem] font-bold text-slate-900">{t("sourceValue")}</p>
                  <p className="text-[0.6875rem] text-slate-400">{t("sourceHint")}</p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#37AEE2] text-white shadow-[0_6px_18px_-6px_rgba(55,174,226,0.7)]">
                  <Landmark className="h-4.5 w-4.5" />
                </span>
              </div>

              {/* 3. Total transactions + withdrawal availability per client */}
              <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.75rem] font-medium text-slate-400">{t("totalTransactions")}</p>
                    <p className="mt-0.5 font-mono text-[1.375rem] font-bold tabular-nums text-slate-900" dir="ltr">
                      0
                    </p>
                    <p className="text-[0.6875rem] text-slate-400">{t("allTime")}</p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <ReceiptText className="h-4.5 w-4.5" />
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <span className="text-[0.75rem] font-medium text-slate-500">{t("withdrawAvailable")}</span>
                  <button
                    type="button"
                    onClick={() => setStateIdx((i) => (i + 1) % WITHDRAW_STATES.length)}
                    className={cn(
                      "rounded-full px-3 py-1 text-[0.75rem] font-bold transition-colors",
                      state.cls
                    )}
                    aria-label={t("withdrawAvailable")}
                  >
                    {t(state.key)}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
