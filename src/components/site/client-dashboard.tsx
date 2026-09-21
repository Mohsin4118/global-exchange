"use client";

/* ------------------------------------------------------------------ */
/*  CryptoWise — Client Portal (WHITE / LIGHT banking dashboard)       */
/*  Clients land here right after signing in. Everything is served by  */
/*  /api/client for the signed-in token only — the Super Admin curates */
/*  every figure from the CRM and this dashboard re-reads it every few  */
/*  seconds. Left menu (desktop) + drawer menu (mobile) switch between */
/*  fully functional client sections. Strictly self-scoped data.       */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Bell,
  Download,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  PieChart,
  Plus,
  ShieldAlert,
  UserRoundCog,
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
  PrivateBadge,
  ProfileCard,
  RequestModal,
  SectionTitle,
  SourceOfFundsCard,
  TierBadge,
  TxRowItem,
  VerifiedBadge,
  buildHoldingRows,
  initials,
  makeMoney,
  usd,
  type RequestKind,
  type T,
} from "./dashboard-parts";
import { useToast } from "@/hooks/use-toast";
import { apiClientAction, apiClientGet, apiLogout } from "@/lib/api";
import { SITE_EMAIL, SITE_PHONE_DISPLAY, SITE_PHONE_TEL } from "@/lib/contact";
import type { Coin } from "@/lib/market";
import { CURRENCIES } from "@/lib/shared-types";
import type { ClientView, CurrencyCode, Tx } from "@/lib/shared-types";
import { CURRENCY_META } from "./dashboard-parts";
import type { Lang, StringKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Section = "overview" | "portfolio" | "transactions" | "deposits" | "withdrawals" | "notifications" | "account";
type TxFilter = "all" | "in" | "out";
const COMPANIES_HOUSE_URL = "https://find-and-update.company-information.service.gov.uk/company/16728292";

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
  const [section, setSection] = useState<Section>("overview");
  const [drawer, setDrawer] = useState(false);
  const [txFilter, setTxFilter] = useState<TxFilter>("all");
  const [reqModal, setReqModal] = useState<null | RequestKind>(null);
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
    setView({ client: res.client!, financials: res.financials!, txs: res.txs!, notifications: res.notifications!, fx: res.fx! });
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

  /* The dashboard ALWAYS opens at the very top: session restore / browser
     scroll restoration must never land the client mid-page with the welcome
     section hidden above the viewport ("top cut off") — one normal page
     scroll starting at the welcome header, below the sticky topbar. */
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  /* ---- live portfolio math (server balance + live market prices) ---- */
  const markets = useMemo(() => [...coins, ...stocks], [coins, stocks]);
  const holdingRows = useMemo(() => (view ? buildHoldingRows(view.client.holdings, markets) : []), [view, markets]);
  const invested = holdingRows.reduce((s, r) => s + r.value, 0);
  const cash = view?.financials.balance ?? 0;
  const available = view?.financials.available ?? 0;
  const total = cash + invested;
  const portfolioChange = invested > 0 ? holdingRows.reduce((s, r) => s + r.coin.change24h * r.value, 0) / invested : 0;
  const totalDeposits = view?.financials.credits ?? 0;
  const totalWithdrawn = useMemo(() => (view ? view.txs.filter((x) => x.kind === "withdrawal" && x.status === "COMPLETED").reduce((s, x) => s + x.amount, 0) : 0), [view]);

  const suspended = view?.client.status === "suspended";
  const unread = view?.notifications.filter((n) => n.unread).length ?? 0;

  /* ---- display currency: one formatter drives every figure (#10) ---- */
  const cur = view?.client.currency ?? "USD";
  const fx = view?.fx ?? { USD: 1 };
  const money = useMemo(() => makeMoney(cur, fx), [cur, fx]);
  const setCurrency = async (code: CurrencyCode) => {
    if (!CURRENCIES.includes(code)) return;
    const res = await apiClientAction({ action: "set-currency", currency: code });
    if (res.ok && res.client && res.txs) {
      setView({ client: res.client, financials: res.financials!, txs: res.txs, notifications: res.notifications!, fx: res.fx! });
    }
  };

  /* ---- session performance chart ---- */
  const [history, setHistory] = useState<number[]>([]);
  const lastTotalRef = useRef(total);
  useEffect(() => {
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
  const submitRequest = async (payload: { kind: RequestKind; amount: number; asset: string; destination: string; note: string }): Promise<string | null> => {
    const res = await apiClientAction({ action: "request-transaction", ...payload });
    if (!res.ok) {
      return res.error === "funds" ? "requestTooMuch" : res.error === "duplicate" ? "requestDuplicate" : "requestInvalid";
    }
    if (res.client && res.txs) setView({ client: res.client, financials: res.financials!, txs: res.txs, notifications: res.notifications!, fx: res.fx! });
    toast({ title: t("requestSent"), description: t("requestSentSub") });
    setReqModal(null);
    return null;
  };

  /* the ONLY mutation a client may make on a request: cancelling their own PENDING one */
  const cancelRequest = async (tx: { id: string; reference: string }) => {
    const res = await apiClientAction({ action: "cancel-request", id: tx.id });
    if (!res.ok) {
      toast({ title: t("requestInvalid") });
      return;
    }
    if (res.client && res.txs) setView({ client: res.client, financials: res.financials!, txs: res.txs, notifications: res.notifications!, fx: res.fx! });
    toast({ title: t("requestCancelledToast"), description: t("requestCancelledSub") });
  };

  const markAllRead = async () => {
    const res = await apiClientAction({ action: "mark-read", ids: "all" });
    if (res.ok && res.client && res.txs) {
      setView({ client: res.client, financials: res.financials!, txs: res.txs, notifications: res.notifications!, fx: res.fx! });
    }
  };

  const saveProfile = async (patch: { phone: string; country: string; address: string; city: string; postcode: string }): Promise<string | null> => {
    const res = await apiClientAction({ action: "update-profile", ...patch });
    if (!res.ok) return "requestInvalid";
    if (res.client && res.txs) setView({ client: res.client, financials: res.financials!, txs: res.txs, notifications: res.notifications!, fx: res.fx! });
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
  const txs = view?.txs ?? [];
  const filteredTxs = useMemo(() => txs.filter((tx) => txFilter === "all" || (txFilter === "in" ? tx.type === "CREDIT" : tx.type === "DEBIT")), [txs, txFilter]);
  const deposits = useMemo(() => txs.filter((tx) => tx.kind === "deposit"), [txs]);
  const withdrawals = useMemo(() => txs.filter((tx) => tx.kind === "withdrawal"), [txs]);
  const pendingWithdrawalTotal = withdrawals.filter((w) => w.status === "PENDING" || w.status === "PROCESSING").reduce((s, w) => s + w.amount, 0);

  const allocation = useMemo(() => {
    const segs = holdingRows.map((r) => ({ label: r.coin.name, value: r.value, color: r.coin.color }));
    if (cash > 0) segs.unshift({ label: t("cash"), value: cash, color: "#10b981" });
    return segs;
  }, [holdingRows, cash, t]);

  /* ---- menu definition (every item works — switches sections) ---- */
  const NAV: Array<{ id: Section; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: "overview", label: t("menuOverview"), icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "portfolio", label: t("menuPortfolio"), icon: <PieChart className="h-4 w-4" /> },
    { id: "transactions", label: t("menuTransactions"), icon: <ArrowLeftRight className="h-4 w-4" /> },
    { id: "deposits", label: t("menuDeposits"), icon: <ArrowDownLeft className="h-4 w-4" /> },
    { id: "withdrawals", label: t("menuWithdrawals"), icon: <ArrowUpRight className="h-4 w-4" /> },
    { id: "notifications", label: t("menuNotifications"), icon: <Bell className="h-4 w-4" />, badge: unread },
    { id: "account", label: t("menuAccount"), icon: <UserRoundCog className="h-4 w-4" /> },
  ];

  const go = (s: Section) => {
    setSection(s);
    setDrawer(false);
    window.scrollTo({ top: 0 });
  };

  if (!ready || !view) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa]">
        <div className="flex flex-col items-center gap-3">
          <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-emerald-200 border-t-emerald-600" />
          <p className="text-sm font-semibold text-slate-400">CryptoWise</p>
        </div>
      </div>
    );
  }

  const c = view.client;

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f5f7fa] text-slate-900 [color-scheme:light]">

      {/* ---------- topbar ---------- */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center justify-between gap-2 px-4 sm:h-16 sm:gap-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setDrawer(true)}
              aria-label="Open menu"
              aria-expanded={drawer}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <LogoMark className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
            <div className="min-w-0">
              <p className="truncate text-[0.84375rem] font-bold leading-tight text-slate-900 sm:text-[0.875rem]">CryptoWise</p>
              <p className="truncate text-[0.65625rem] font-semibold text-emerald-600 sm:text-[0.6875rem]">{t("clientArea")}</p>
            </div>
            <span className="ms-1 hidden shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[0.6875rem] font-bold text-slate-500 ring-1 ring-white/10 md:inline-block" dir="ltr">
              {t("accountNo")} {c.accountNo}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              onClick={onLangToggle}
              className="flex h-9 items-center rounded-lg border border-slate-200 px-2.5 text-[0.71875rem] font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:px-3 sm:text-[0.75rem]"
              aria-label="Toggle language"
            >
              {lang === "en" ? "العربية" : "EN"}
            </button>
            <button
              onClick={() => go("notifications")}
              aria-label={t("notificationsTitle")}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[0.59375rem] font-bold text-[#022c20]">{unread}</span>
              )}
            </button>
            <div className="hidden items-center gap-2.5 rounded-full border border-slate-200 py-1 pe-3 ps-1 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00E5A0] text-[0.6875rem] font-bold text-[#022c20]">{initials(c.name)}</span>
              <span className="hidden text-left leading-tight md:block" dir="auto">
                <span className="block max-w-[120px] truncate text-[0.75rem] font-bold text-slate-900">{c.name}</span>
                <span className="block text-[0.65625rem] font-semibold text-slate-500">{t("privateClient")}</span>
              </span>
            </div>
            <button
              onClick={signOut}
              aria-label={t("signOut")}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[0.75rem] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:px-3"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{t("signOut")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ---------- body: sidebar + content ---------- */}
      <div className="relative mx-auto flex w-full max-w-[1280px] items-start gap-6 px-4 sm:px-6">
        {/* desktop sidebar */}
        <aside className="sticky top-[72px] hidden w-[218px] shrink-0 py-6 lg:block" aria-label="Client menu">
          <nav className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm p-2">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                aria-current={section === item.id ? "page" : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[0.8125rem] font-semibold transition-colors",
                  section === item.id ? "bg-emerald-50 text-emerald-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                {item.icon}
                <span className="flex-1 text-start">{item.label}</span>
                {!!item.badge && item.badge > 0 && (
                  <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-amber-400 px-1 text-[0.625rem] font-bold text-[#022c20]">{item.badge}</span>
                )}
              </button>
            ))}
            <a
              href={COMPANIES_HOUSE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[0.8125rem] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="flex-1 text-start">{t("menuLicense")}</span>
            </a>
            <div className="my-2 h-px bg-slate-100" />
            <button
              onClick={signOut}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[0.8125rem] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" />
              <span className="flex-1 text-start">{t("signOut")}</span>
            </button>
          </nav>
          <p className="mt-3 px-3 text-[0.65625rem] leading-relaxed text-slate-400" dir="ltr">
            {t("accountNo")} {c.accountNo}
          </p>
        </aside>

        {/* content */}
        <main className="min-w-0 flex-1 py-4 sm:py-6">
          {section === "overview" && (
            <OverviewSection
              view={view}
              t={t}
              lang={lang}
              coins={coins}
              stocks={stocks}
              holdingRows={holdingRows}
              invested={invested}
              cash={cash}
              total={total}
              available={available}
              portfolioChange={portfolioChange}
              totalDeposits={totalDeposits}
              history={history}
              allocation={allocation}
              suspended={!!suspended}
              money={money}
              cur={cur}
              onCurrency={setCurrency}
              onDeposit={() => !suspended && setReqModal("deposit")}
              onWithdraw={() => !suspended && setReqModal("withdrawal")}
              onGo={go}
            />
          )}

          {section === "portfolio" && (
            <div className="grid grid-cols-1 gap-5">
              <SectionHeading title={t("menuPortfolio")} sub={t("welcomeSub")} />
              <HoldingsTable rows={holdingRows} t={t} lang={lang} />
              <AllocationBar segments={allocation} t={t} />
              <MarketStrip coins={coins} stocks={stocks} t={t} />
            </div>
          )}

          {section === "transactions" && (
            <div className="grid grid-cols-1 gap-5">
              <SectionHeading title={t("txHistory")} sub={`${txs.length} · ${t("allTime")}`} />
              <div className="flex flex-wrap items-center justify-between gap-2.5">
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
                      className={cn("rounded-md px-2.5 py-1.5 text-[0.71875rem] font-bold transition-colors", txFilter === key ? "bg-emerald-100 text-emerald-600" : "text-slate-500 hover:text-slate-900")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => !suspended && setReqModal("deposit")}
                    disabled={suspended}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#00E5A0] px-3 py-2 text-[0.71875rem] font-bold text-[#022c20] transition-colors hover:bg-[#2cf0b5] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" /> {t("newRequest")}
                  </button>
                  <button onClick={downloadCsv} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-[0.71875rem] font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
                    <Download className="h-3.5 w-3.5" /> CSV
                  </button>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <ul className="divide-y divide-slate-100">
                  {(showAllTxs ? filteredTxs : filteredTxs.slice(0, 12)).map((tx) => (
                    <TxRowItem key={tx.id} tx={tx} t={t} lang={lang} money={money} onCancel={suspended ? undefined : cancelRequest} />
                  ))}
                  {filteredTxs.length === 0 && (
                    <li className="px-6 py-12 text-center text-[0.8125rem] text-slate-500">{t("noTx")}</li>
                  )}
                </ul>
                {filteredTxs.length > 12 && (
                  <button onClick={() => setShowAllTxs((v) => !v)} className="w-full border-t border-slate-200/70 py-3 text-[0.78125rem] font-bold text-emerald-600 transition-colors hover:bg-emerald-50">
                    {showAllTxs ? "−" : "+"} {t("viewAllTx")} ({filteredTxs.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {section === "deposits" && (
            <DepositsSection t={t} lang={lang} deposits={deposits} totalDeposits={totalDeposits} suspended={!!suspended} money={money} onDeposit={() => !suspended && setReqModal("deposit")} onCancel={suspended ? undefined : cancelRequest} />
          )}

          {section === "withdrawals" && (
            <WithdrawalsSection t={t} lang={lang} withdrawals={withdrawals} available={available} pendingTotal={pendingWithdrawalTotal} totalWithdrawn={totalWithdrawn} suspended={!!suspended} money={money} onWithdraw={() => !suspended && setReqModal("withdrawal")} onCancel={suspended ? undefined : cancelRequest} />
          )}

          {section === "notifications" && (
            <div className="grid grid-cols-1 gap-5">
              <SectionHeading title={t("notificationsTitle")} sub={t("contactSub")} />
              <NotificationsCard notifications={view.notifications} t={t} onMarkAll={markAllRead} />
            </div>
          )}

          {section === "account" && (
            <div className="grid grid-cols-1 gap-5">
              <SectionHeading title={t("menuAccount")} sub={`${t("accountNo")} ${c.accountNo}`} />
              <ProfileCard view={view} t={t} lang={lang} money={money} onProfileSave={saveProfile} onPasswordSave={savePassword} onCurrencyChange={setCurrency} />
              <ContactCard t={t} />
            </div>
          )}

          {/* support footer */}
          <p className="mb-2 mt-8 text-center text-[0.71875rem] text-slate-400">
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
      </div>

      {/* ---------- mobile drawer menu ---------- */}
      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
              onClick={() => setDrawer(false)}
            />
            <motion.nav
              initial={{ x: lang === "ar" ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: lang === "ar" ? "100%" : "-100%" }}
              transition={{ duration: 0.26, ease: "easeOut" }}
              className="absolute bottom-0 start-0 top-0 flex w-[272px] max-w-[82vw] flex-col border-e border-slate-200 bg-white shadow-2xl"
              aria-label="Client menu"
            >
              <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-4">
                <div className="flex items-center gap-2.5">
                  <LogoMark className="h-8 w-8" />
                  <div>
                    <p className="text-[0.84375rem] font-bold leading-tight text-slate-900">CryptoWise</p>
                    <p className="text-[0.65625rem] font-semibold text-emerald-600">{t("clientArea")}</p>
                  </div>
                </div>
                <button onClick={() => setDrawer(false)} aria-label="Close menu" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="border-b border-slate-200/80 px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00E5A0] text-[0.75rem] font-bold text-[#022c20]">{initials(c.name)}</span>
                  <div className="min-w-0" dir="auto">
                    <p className="truncate text-[0.8125rem] font-bold text-slate-900">{c.name}</p>
                    <p className="text-[0.65625rem] font-semibold text-slate-400" dir="ltr">
                      {t("accountNo")} {c.accountNo}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {NAV.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => go(item.id)}
                    aria-current={section === item.id ? "page" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-[0.84375rem] font-semibold transition-colors",
                      section === item.id ? "bg-emerald-50 text-emerald-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    )}
                  >
                    {item.icon}
                    <span className="flex-1 text-start">{item.label}</span>
                    {!!item.badge && item.badge > 0 && (
                      <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-amber-400 px-1 text-[0.625rem] font-bold text-[#022c20]">{item.badge}</span>
                    )}
                  </button>
                ))}
                <a
                  href={COMPANIES_HOUSE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setDrawer(false)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-[0.84375rem] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="flex-1 text-start">{t("menuLicense")}</span>
                </a>
              </div>
              <div className="border-t border-slate-200/80 p-2">
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-[0.84375rem] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="flex-1 text-start">{t("signOut")}</span>
                </button>
              </div>
            </motion.nav>
          </div>
        )}
      </AnimatePresence>

      {reqModal && <RequestModal initialKind={reqModal} t={t} available={available} onClose={() => setReqModal(null)} onSubmit={submitRequest} />}
    </div>
  );
}

/* ---------------- section heading ---------------- */

function SectionHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <h1 className="text-[1.25rem] font-bold tracking-tight text-slate-900 sm:text-[1.5rem]">{title}</h1>
      {sub && <p className="mt-1 text-[0.8125rem] text-slate-500">{sub}</p>}
    </div>
  );
}

/* ---------------- overview (landing) section ---------------- */

function OverviewSection({
  view,
  t,
  lang,
  coins,
  stocks,
  holdingRows,
  invested,
  cash,
  total,
  available,
  portfolioChange,
  totalDeposits,
  history,
  allocation,
  suspended,
  money,
  cur,
  onCurrency,
  onDeposit,
  onWithdraw,
  onGo,
}: {
  view: ClientView;
  t: T;
  lang: Lang;
  coins: Coin[];
  stocks: Coin[];
  holdingRows: ReturnType<typeof buildHoldingRows>;
  invested: number;
  cash: number;
  total: number;
  available: number;
  portfolioChange: number;
  totalDeposits: number;
  history: number[];
  allocation: Array<{ label: string; value: number; color: string }>;
  suspended: boolean;
  money: (n: number) => string;
  cur: string;
  onCurrency: (code: CurrencyCode) => void;
  onDeposit: () => void;
  onWithdraw: () => void;
  onGo: (s: Section) => void;
}) {
  const c = view.client;
  const recent = view.txs.slice(0, 5);

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5">
      {/* welcome header — real client identity from the authenticated session */}
      <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="min-w-0 text-[1.25rem] font-bold leading-snug tracking-tight text-slate-900 sm:text-[1.5rem] sm:leading-tight lg:text-[1.75rem]">
              {t("welcomeTitle")}{" "}
              <span className="whitespace-normal break-words" dir="auto">
                {c.name}
              </span>
            </h1>
            {/* green Verified badge with a check icon — next to the client name */}
            <VerifiedBadge verified={c.kycStatus === "verified"} t={t} />
          </div>
          {/* "Private" badge — under the name (tier chip only when not already Private) */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PrivateBadge t={t} />
            {c.tier !== "Private" && <TierBadge tier={c.tier} t={t} />}
          </div>
          <p className="mt-2.5 text-[0.8125rem] text-slate-500 sm:text-[0.84375rem]">{t("welcomeSub")}</p>
          <p className="mt-1 text-[0.75rem] font-semibold text-slate-500 sm:text-[0.78125rem]">
            {t("accountNo")}{" "}
            <span dir="ltr" className="font-mono text-slate-600">
              {c.accountNo}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={onDeposit}
            disabled={suspended}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#00E5A0] px-4 text-[0.8125rem] font-bold text-[#022c20] shadow-[0_8px_24px_-10px_rgba(0,229,160,0.7)] transition-all hover:bg-[#2cf0b5] disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:px-5"
          >
            <ArrowDownLeft className="h-4 w-4" /> {t("deposit")}
          </button>
          <button
            onClick={onWithdraw}
            disabled={suspended}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[0.8125rem] font-bold text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:px-5"
          >
            <ArrowUpRight className="h-4 w-4" /> {t("withdraw")}
          </button>
        </div>
      </div>

      {c.managerNote && !suspended && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 sm:px-5 sm:py-3.5">
          <p className="text-[0.75rem] font-bold text-emerald-600 sm:text-[0.78125rem]">{t("managerNoteTitle")}</p>
          <p className="mt-1 text-[0.78125rem] leading-relaxed text-slate-600 sm:text-[0.8125rem]">{c.managerNote}</p>
        </div>
      )}

      {suspended && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3.5 sm:px-5">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-[0.8125rem] font-bold text-amber-800">{t("suspendedBanner")}</p>
            <p className="mt-0.5 text-[0.78125rem] text-amber-700">{t("suspendedSub")}</p>
          </div>
        </div>
      )}

      {/* financial cards — required order: TOTAL BALANCE → SOURCE (immediately
          BELOW Total Balance) → CASH AVAILABLE → INVESTED → PORTFOLIO
          PERFORMANCE (chart below). SOURCE uses the EXACT same card design
          system as Total Balance (same Card surface, padding, label row,
          icon chip, typography slots) — only the content differs: Total
          Balance shows the live balance, SOURCE shows the free text curated
          by the Super Admin for this client. Short entries use the big bold
          value typography; longer compliance texts wrap compactly so the
          card never balloons. Stacked full-width on every viewport, so
          SOURCE is ALWAYS directly under Total Balance — desktop, tablet
          and mobile. */}
      <div className="grid grid-cols-1 gap-2.5 sm:gap-4">
        <KpiCard
          label={t("totalBalance")}
          value={money(total)}
          sub={`${portfolioChange >= 0 ? "+" : ""}${portfolioChange.toFixed(2)}% · ${t("change24h")}`}
          subTone={portfolioChange >= 0 ? "up" : "down"}
          icon={<Wallet className="h-4 w-4" />}
        />
        <SourceOfFundsCard text={c.sourceOfFunds} t={t} />
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4">
          <KpiCard
            label={t("cashAvailable")}
            value={money(cash)}
            sub={`${t("availableFunds")}: ${money(available)}`}
            icon={<ArrowDownLeft className="h-4 w-4" />}
          />
          <KpiCard
            label={t("invested")}
            value={money(invested)}
            sub={`${t("totalDeposits")}: ${money(totalDeposits)}`}
            icon={<PieChart className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* display currency — switching it re-formats every figure from ONE source (#10) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 shadow-sm sm:px-3.5 sm:py-2.5">
        <label className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-[0.6875rem] font-bold uppercase tracking-wide text-slate-400 sm:text-[0.75rem]">{t("displayCurrency")}</span>
          <select
            value={cur}
            onChange={(e) => onCurrency(e.target.value as CurrencyCode)}
            aria-label={t("displayCurrency")}
            dir="ltr"
            className="h-9 max-w-[190px] rounded-lg border border-slate-200 bg-white px-2.5 text-[1rem] font-bold text-slate-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 sm:text-[0.8125rem]"
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code} · {CURRENCY_META[code]?.label ?? code}
              </option>
            ))}
          </select>
        </label>
        <p className="hidden text-[0.65625rem] leading-snug text-slate-400 sm:block">{t("currencyNote")}</p>
      </div>

      {/* chart + market */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr] xl:gap-5">
        <PerformanceChart history={history} t={t} money={money} />
        <MarketStrip coins={coins} stocks={stocks} t={t} singleColumn money={money} />
      </div>

      {/* holdings preview + allocation + contacts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr] xl:gap-5">
        <div className="min-w-0">
          <HoldingsTable rows={holdingRows} t={t} lang={lang} money={money} />
        </div>
        <div className="grid grid-cols-1 content-start gap-4 xl:gap-5">
          <AllocationBar segments={allocation} t={t} />
          {/* recent activity preview */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <SectionTitle
              title={t("recentTransactions")}
              right={
                <button onClick={() => onGo("transactions")} className="rounded-lg px-2 py-1 text-[0.71875rem] font-bold text-emerald-600 transition-colors hover:bg-emerald-50">
                  {t("viewAll")}
                </button>
              }
            />
            <ul className="mt-3 divide-y divide-slate-100">
              {recent.map((tx) => (
                <li key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", tx.type === "CREDIT" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800")}>
                    {tx.type === "CREDIT" ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.78125rem] font-semibold text-slate-900">{tx.labelKey ? t(tx.labelKey as StringKey) : tx.label}</p>
                    <p className="text-[0.65625rem] text-slate-400" dir="ltr">
                      {tx.dateISO}
                    </p>
                  </div>
                  <span className={cn("shrink-0 whitespace-nowrap text-[0.78125rem] font-bold tabular-nums", tx.type === "CREDIT" ? "text-emerald-600" : "text-amber-600")} dir="ltr">
                    {tx.type === "CREDIT" ? "+" : "−"}
                    {money(tx.amount)}
                  </span>
                </li>
              ))}
              {recent.length === 0 && <li className="px-6 py-8 text-center text-[0.8125rem] text-slate-500">{t("noTx")}</li>}
            </ul>
          </div>
          <ContactCard t={t} />
        </div>
      </div>
    </div>
  );
}

/* ---------------- deposits section ---------------- */

function DepositsSection({
  t,
  lang,
  deposits,
  totalDeposits,
  suspended,
  money = usd,
  onDeposit,
  onCancel,
}: {
  t: T;
  lang: Lang;
  deposits: Tx[];
  totalDeposits: number;
  suspended: boolean;
  money?: (n: number) => string;
  onDeposit: () => void;
  onCancel?: (tx: Tx) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeading title={t("menuDeposits")} sub={t("requestHint")} />
        <button
          onClick={onDeposit}
          disabled={suspended}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#00E5A0] px-4 text-[0.8125rem] font-bold text-[#022c20] transition-all hover:bg-[#2cf0b5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowDownLeft className="h-4 w-4" /> {t("deposit")}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <KpiCard label={t("depositsTotal")} value={money(totalDeposits)} icon={<ArrowDownLeft className="h-4 w-4" />} />
        <KpiCard label={t("menuDeposits")} value={String(deposits.length)} sub={t("allTime")} icon={<ArrowLeftRight className="h-4 w-4" />} />
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <ul className="divide-y divide-slate-100">
          {deposits.map((tx) => (
            <TxRowItem key={tx.id} tx={tx} t={t} lang={lang} money={money} onCancel={suspended ? undefined : onCancel} />
          ))}
          {deposits.length === 0 && <li className="px-6 py-12 text-center text-[0.8125rem] text-slate-500">{t("noDeposits")}</li>}
        </ul>
      </div>
    </div>
  );
}

/* ---------------- withdrawals section ---------------- */

function WithdrawalsSection({
  t,
  lang,
  withdrawals,
  available,
  pendingTotal,
  totalWithdrawn,
  suspended,
  money = usd,
  onWithdraw,
  onCancel,
}: {
  t: T;
  lang: Lang;
  withdrawals: Tx[];
  available: number;
  pendingTotal: number;
  totalWithdrawn: number;
  suspended: boolean;
  money?: (n: number) => string;
  onWithdraw: () => void;
  onCancel?: (tx: Tx) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeading title={t("menuWithdrawals")} sub={t("requestHint")} />
        <button
          onClick={onWithdraw}
          disabled={suspended}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[0.8125rem] font-bold text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowUpRight className="h-4 w-4" /> {t("withdraw")}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label={t("availableFunds")} value={money(available)} icon={<Wallet className="h-4 w-4" />} />
        <KpiCard label={t("reqPending")} value={money(pendingTotal)} icon={<ArrowUpRight className="h-4 w-4" />} />
        <KpiCard label={t("withdrawalsTotal")} value={money(totalWithdrawn)} icon={<ArrowLeftRight className="h-4 w-4" />} />
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <ul className="divide-y divide-slate-100">
          {withdrawals.map((tx) => (
            <TxRowItem key={tx.id} tx={tx} t={t} lang={lang} money={money} onCancel={suspended ? undefined : onCancel} />
          ))}
          {withdrawals.length === 0 && <li className="px-6 py-12 text-center text-[0.8125rem] text-slate-500">{t("withdrawalsEmpty")}</li>}
        </ul>
      </div>
    </div>
  );
}
