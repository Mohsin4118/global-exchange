"use client";

/* ------------------------------------------------------------------ */
/*  CryptoWise — Client Portal (clean white dashboard)                 */
/*  Everything shown here is served by /api/client for the signed-in   */
/*  token only — the Super Admin curates every figure from the CRM and */
/*  this dashboard re-reads it every few seconds.                      */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Download,
  Landmark,
  LogOut,
  Menu,
  ShieldAlert,
  Wallet,
  X,
} from "lucide-react";
import { LogoMark } from "./icons";
import {
  AllocationBar,
  ContactCard,
  HoldingsTable,
  KpiCard,
  MarketStrip,
  NotificationsCard,
  PerformanceChart,
  ProfileCard,
  RequestModal,
  StatusPill,
  TierBadge,
  TxRowItem,
  VerifiedBadge,
  buildHoldingRows,
  initials,
  usd,
  type T,
} from "./dashboard-parts";
import { useToast } from "@/hooks/use-toast";
import { apiClientAction, apiClientGet, apiLogout } from "@/lib/api";
import { SITE_EMAIL, SITE_PHONE_DISPLAY, SITE_PHONE_TEL } from "@/lib/contact";
import { formatChange, type Coin } from "@/lib/market";
import type { ClientView, Tx } from "@/lib/shared-types";
import type { Lang, StringKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type TxFilter = "all" | "in" | "out";
type WithdrawFilter = "all" | "pending" | "completed";

export function ClientDashboard({
  t,
  lang,
  coins,
  stocks,
  onLangToggle,
  onSignOut,
}: {
  t: (k: StringKey) => string;
  lang: Lang;
  coins: Coin[];
  stocks: Coin[];
  onLangToggle: () => void;
  onSignOut: () => void;
}) {
  const { toast } = useToast();
  const [view, setView] = useState<ClientView | null>(null);
  const [ready, setReady] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [txFilter, setTxFilter] = useState<TxFilter>("all");
  const [wdFilter, setWdFilter] = useState<WithdrawFilter>("all");
  const [reqModal, setReqModal] = useState<null | "deposit" | "withdrawal">(null);
  const [showAllTxs, setShowAllTxs] = useState(false);

  /* ---- live self-refresh: re-read the authorized API snapshot ---- */
  const load = useCallback(async () => {
    const res = await apiClientGet();
    if (!res.ok) {
      if (res.error === "unauthorized" || res.error === "gone") {
        toast({ title: t("accountClosedToast") });
        onSignOut();
      }
      return;
    }
    setView({ client: res.client!, financials: res.financials!, txs: res.txs!, notifications: res.notifications! });
    setReady(true);
  }, [onSignOut, t, toast]);

  useEffect(() => {
    const boot = () => {
      void load();
    };
    boot();
    const id = setInterval(boot, 4000);
    window.addEventListener("focus", boot);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", boot);
    };
  }, [load]);

  /* ---- live portfolio math (server balance + live market prices) ---- */
  const markets = useMemo(() => [...coins, ...stocks], [coins, stocks]);
  const holdingRows = useMemo(() => (view ? buildHoldingRows(view.client.holdings, markets) : []), [view, markets]);
  const invested = holdingRows.reduce((s, r) => s + r.value, 0);
  const cash = view?.financials.balance ?? 0;
  const available = view?.financials.available ?? 0;
  const total = cash + invested;
  const portfolioChange = invested > 0 ? holdingRows.reduce((s, r) => s + r.coin.change24h * r.value, 0) / invested : 0;
  const totalDeposits = view?.financials.credits ?? 0;

  const firstName = view ? view.client.name.trim().split(/\s+/)[0] : "";
  const suspended = view?.client.status === "suspended";

  /* ---- session performance chart ---- */
  const [history, setHistory] = useState<number[]>([]);
  const lastTotalRef = useRef(total);
  useEffect(() => {
    // seed the line once the first real total arrives (never seed with 0)
    setHistory((h) => {
      if (h.length > 0 || total <= 0) return h;
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
      lastTotalRef.current = total;
      return pts;
    });
  }, [total]);

  useEffect(() => {
    const append = () => {
      if (history.length === 0) return;
      if (Math.abs(total - lastTotalRef.current) < 0.005) return;
      lastTotalRef.current = total;
      setHistory((h) => [...h.slice(-79), total]);
    };
    append();
  }, [total, history.length]);

  /* ---- actions ---- */
  const submitRequest = async (kind: "deposit" | "withdrawal", amount: number, note: string): Promise<string | null> => {
    const res = await apiClientAction({ action: "request-transaction", kind, amount, note });
    if (!res.ok) {
      return res.error === "funds" ? "requestTooMuch" : res.error === "amount" ? "requestInvalid" : "requestInvalid";
    }
    if (res.client && res.txs) setView({ client: res.client, financials: res.financials!, txs: res.txs, notifications: res.notifications! });
    toast({ title: t("requestSent"), description: t("requestSentSub") });
    setReqModal(null);
    return null;
  };

  const markAllRead = async () => {
    const res = await apiClientAction({ action: "mark-read", ids: "all" });
    if (res.ok && res.client && res.txs) {
      setView({ client: res.client, financials: res.financials!, txs: res.txs, notifications: res.notifications! });
    }
  };

  const saveProfile = async (patch: { phone: string; country: string; address: string; city: string; postcode: string }): Promise<string | null> => {
    const res = await apiClientAction({ action: "update-profile", ...patch });
    if (!res.ok) return "requestInvalid";
    if (res.client && res.txs) setView({ client: res.client, financials: res.financials!, txs: res.txs, notifications: res.notifications! });
    toast({ title: t("profileSaved") });
    return null;
  };

  const savePassword = async (current: string, next: string): Promise<string | null> => {
    const res = await apiClientAction({ action: "change-password", current, next });
    if (!res.ok) return res.error === "wrong-current" ? "wrongCurrentPassword" : res.error === "weak" ? "weakPassword" : "requestInvalid";
    toast({ title: t("passwordChangedToast") });
    return null;
  };

  const signOut = async () => {
    await apiLogout("client");
    onSignOut();
  };

  const downloadCsv = () => {
    if (!view) return;
    const header = "Date,Description,Asset,Method,Type,Amount USD,Status,Reference\n";
    const lines = view.txs.map((tx) =>
      [tx.dateISO, `"${(tx.labelKey ? t(tx.labelKey as StringKey) : tx.label).replace(/"/g, '""')}"`, tx.asset ?? "", `"${tx.method}"`, tx.type, tx.amount.toFixed(2), tx.status, tx.reference].join(","),
    );
    const blob = new Blob([header + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cryptowise-statement-${view.client.accountNo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: t("statementToast") });
  };

  /* ---- derived lists ---- */
  const filteredTxs = useMemo(() => (view ? view.txs.filter((tx) => txFilter === "all" || (txFilter === "in" ? tx.type === "CREDIT" : tx.type === "DEBIT")) : []), [view, txFilter]);
  const withdrawals = useMemo(() => (view ? view.txs.filter((tx) => tx.kind === "withdrawal") : []), [view]);
  const filteredWd = useMemo(
    () =>
      withdrawals.filter((tx) =>
        wdFilter === "all" ? true : wdFilter === "pending" ? tx.status === "PENDING" || tx.status === "PROCESSING" : tx.status === "COMPLETED",
      ),
    [withdrawals, wdFilter],
  );
  const pendingWithdrawalTotal = withdrawals.filter((w) => w.status === "PENDING" || w.status === "PROCESSING").reduce((s, w) => s + w.amount, 0);
  const completedWithdrawals = withdrawals.filter((w) => w.status === "COMPLETED");
  const unread = view?.notifications.filter((n) => n.unread).length ?? 0;

  const allocation = useMemo(() => {
    const segs = holdingRows.map((r) => ({ label: r.coin.name, value: r.value, color: r.coin.color }));
    if (cash > 0) segs.unshift({ label: t("cash"), value: cash, color: "#10b981" });
    return segs;
  }, [holdingRows, cash, t]);

  const shownTxs = showAllTxs ? filteredTxs : filteredTxs.slice(0, 8);

  if (!ready || !view) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb]">
        <div className="flex flex-col items-center gap-3">
          <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-emerald-500/25 border-t-emerald-500" />
          <p className="text-sm font-semibold text-slate-500">CryptoWise</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900 [color-scheme:light]">
      {/* ---------- topbar ---------- */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setMobileNav((v) => !v)} aria-label="Menu" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 lg:hidden">
              {mobileNav ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
            <LogoMark className="h-9 w-9 shrink-0" />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-[14px] font-bold leading-tight text-slate-900">CryptoWise</p>
              <p className="text-[11px] font-semibold text-emerald-600">{t("clientPortal")}</p>
            </div>
            <span className="ms-1 hidden rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 md:inline-block" dir="ltr">
              {t("accountNo")} {view.client.accountNo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onLangToggle}
              className="flex h-9 items-center rounded-lg border border-slate-200 px-3 text-[12px] font-bold text-slate-600 transition-colors hover:bg-slate-50"
              aria-label="Toggle language"
            >
              {lang === "en" ? "العربية" : "EN"}
            </button>
            <div className="relative">
              <button
                onClick={markAllRead}
                aria-label={t("notificationsTitle")}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9.5px] font-bold text-white">{unread}</span>
                )}
              </button>
            </div>
            <div className="flex items-center gap-2.5 rounded-full border border-slate-200 py-1 pe-3 ps-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">{initials(view.client.name)}</span>
              <span className="hidden text-left leading-tight sm:block" dir="auto">
                <span className="block max-w-[120px] truncate text-[12px] font-bold text-slate-900">{view.client.name}</span>
                <span className="block text-[10.5px] font-semibold text-slate-400">{t("privateClient")}</span>
              </span>
            </div>
            <button
              onClick={signOut}
              aria-label={t("signOut")}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("signOut")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ---------- body ---------- */}
      <main className="mx-auto w-full max-w-[1240px] px-4 pb-14 pt-7 sm:px-6">
        {mobileNav && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <TierBadge tier={view.client.tier} t={t} />
              <VerifiedBadge verified={view.client.kycStatus === "verified"} t={t} />
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500" dir="ltr">
                {t("memberSince")} {view.client.createdAtISO.slice(0, 4)}
              </span>
            </div>
          </motion.div>
        )}

        {/* welcome */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold text-emerald-600">{t("welcomeBack")}</p>
            <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-tight text-slate-900 sm:text-[30px]">{firstName}</h1>
            <p className="mt-1 text-[13.5px] text-slate-500">{t("welcomeSub")}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <TierBadge tier={view.client.tier} t={t} />
              <VerifiedBadge verified={view.client.kycStatus === "verified"} t={t} />
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-bold text-slate-500" dir="ltr">
                {t("memberSince")} {view.client.createdAtISO.slice(0, 4)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => !suspended && setReqModal("deposit")}
              disabled={suspended}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-[13.5px] font-bold text-white shadow-[0_8px_24px_-10px_rgba(16,185,129,0.7)] transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowDownLeft className="h-4 w-4" /> {t("deposit")}
            </button>
            <button
              onClick={() => !suspended && setReqModal("withdrawal")}
              disabled={suspended}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[13.5px] font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowUpRight className="h-4 w-4" /> {t("withdraw")}
            </button>
          </div>
        </div>

        {view.client.managerNote && !suspended && (
          <div className="mb-5 rounded-2xl border border-emerald-200/70 bg-emerald-50/60 px-5 py-4">
            <p className="text-[12.5px] font-bold text-emerald-700">{t("managerNoteTitle")}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-emerald-900/80">{view.client.managerNote}</p>
          </div>
        )}

        {suspended && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-[13px] font-bold text-amber-800">{t("suspendedBanner")}</p>
              <p className="mt-0.5 text-[12.5px] text-amber-700">{t("suspendedSub")}</p>
            </div>
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label={t("totalBalance")} value={usd(total)} sub={`${portfolioChange >= 0 ? "+" : ""}${portfolioChange.toFixed(2)}% · 24h`} subTone={portfolioChange >= 0 ? "up" : "down"} icon={<Wallet className="h-4 w-4" />} />
          <KpiCard label={t("cashAvailable")} value={usd(cash)} sub={t("cash")} icon={<Landmark className="h-4 w-4" />} />
          <KpiCard label={t("availableFunds")} value={usd(available)} sub={pendingWithdrawalTotal > 0 ? `−${usd(pendingWithdrawalTotal)} ${t("reqPending").toLowerCase()}` : undefined} icon={<Wallet className="h-4 w-4" />} />
          <KpiCard label={t("portfolioValue")} value={usd(invested)} sub={`${t("totalDeposits")}: ${usd(totalDeposits)}`} icon={<ArrowUpRight className="h-4 w-4" />} />
        </div>

        {/* chart + market */}
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.5fr_1fr]">
          <PerformanceChart history={history} t={t} />
          <div className="grid grid-cols-1 gap-5">
            <MarketStrip coins={coins} stocks={stocks} t={t} />
          </div>
        </div>

        {/* holdings + allocation */}
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.5fr_1fr]">
          <HoldingsTable rows={holdingRows} t={t} lang={lang} />
          <div className="grid grid-cols-1 content-start gap-5">
            <AllocationBar segments={allocation} t={t} />
            <ContactCard t={t} />
          </div>
        </div>

        {/* transactions + withdrawals */}
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.5fr_1fr]">
          {/* statement */}
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
              <h2 className="text-[15px] font-bold tracking-tight text-slate-900">{t("txHistory")}</h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                  {(
                    [
                      ["all", t("filterAll")],
                      ["in", t("filterIn")],
                      ["out", t("filterOut")],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setTxFilter(key)}
                      className={cn("rounded-md px-2.5 py-1.5 text-[11.5px] font-bold transition-colors", txFilter === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button onClick={downloadCsv} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11.5px] font-bold text-slate-600 transition-colors hover:bg-slate-50">
                  <Download className="h-3.5 w-3.5" /> CSV
                </button>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
              <ul className="divide-y divide-slate-50">
                {shownTxs.map((tx) => (
                  <TxRowItem key={tx.id} tx={tx} t={t} lang={lang} />
                ))}
                {shownTxs.length === 0 && <li className="px-6 py-12 text-center text-[13px] text-slate-500">{t("noTx")}</li>}
              </ul>
              {filteredTxs.length > 8 && (
                <button onClick={() => setShowAllTxs((v) => !v)} className="w-full border-t border-slate-100 py-3 text-[12.5px] font-bold text-emerald-600 transition-colors hover:bg-emerald-50/40">
                  {showAllTxs ? "−" : "+"} {t("viewAllTx")} ({filteredTxs.length})
                </button>
              )}
            </div>
          </div>

          {/* withdrawals + notifications */}
          <div className="grid grid-cols-1 content-start gap-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5 sm:px-6">
                <h2 className="text-[15px] font-bold tracking-tight text-slate-900">{t("withdrawalsTitle")}</h2>
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                  {(
                    [
                      ["all", t("filterAll")],
                      ["pending", t("reqPending")],
                      ["completed", t("statusCompleted")],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setWdFilter(key)}
                      className={cn("rounded-md px-2 py-1.5 text-[11px] font-bold transition-colors", wdFilter === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <ul className="mt-2 divide-y divide-slate-50">
                {filteredWd.slice(0, 6).map((tx: Tx) => (
                  <li key={tx.id} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-900">{tx.label}</p>
                      <p className="mt-0.5 text-[11.5px] text-slate-400" dir="ltr">
                        {tx.dateISO} · {tx.method}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="whitespace-nowrap text-[13px] font-bold tabular-nums text-amber-600" dir="ltr">
                        −{usd(tx.amount)}
                      </span>
                      <StatusPill status={tx.status} t={t} />
                    </div>
                  </li>
                ))}
                {filteredWd.length === 0 && <li className="px-6 py-10 text-center text-[13px] text-slate-500">{t("withdrawalsEmpty")}</li>}
              </ul>
              {completedWithdrawals.length > 0 && (
                <p className="border-t border-slate-100 px-5 py-3 text-[11.5px] text-slate-400 sm:px-6" dir="ltr">
                  {t("withdrawalsTitle")}: −{usd(completedWithdrawals.reduce((s, w) => s + w.amount, 0))}
                </p>
              )}
            </div>
            <NotificationsCard notifications={view.notifications} t={t} onMarkAll={markAllRead} limit={6} />
          </div>
        </div>

        {/* profile */}
        <div className="mt-5">
          <ProfileCard view={view} t={t} lang={lang} onProfileSave={saveProfile} onPasswordSave={savePassword} />
        </div>

        {/* support footer */}
        <p className="mt-8 text-center text-[12px] text-slate-400">
          {t("supportTitle")} ·{" "}
          <a href={SITE_PHONE_TEL} className="font-semibold text-slate-500 hover:text-emerald-600" dir="ltr">
            {SITE_PHONE_DISPLAY}
          </a>{" "}
          ·{" "}
          <a href={`mailto:${SITE_EMAIL}`} className="font-semibold text-slate-500 hover:text-emerald-600">
            {SITE_EMAIL}
          </a>
        </p>
      </main>

      {reqModal && <RequestModal kind={reqModal} t={t} available={available} onClose={() => setReqModal(null)} onSubmit={(amount, note) => submitRequest(reqModal, amount, note)} />}
      <span className="hidden">{formatChange(0)}</span>
    </div>
  );
}
