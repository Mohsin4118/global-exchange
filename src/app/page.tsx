"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "@/components/site/header";
import { Hero, TaglineStrip } from "@/components/site/hero";
import { Pillars, Ticker, LiveMarket, StocksSection } from "@/components/site/market-sections";
import { Infrastructure, TradingSection, WhyChooseUs, Steps } from "@/components/site/trading-sections";
import { AccountPreview } from "@/components/site/account-preview";
import { SupportedCryptos, SecuritySection, FinalCta, Footer } from "@/components/site/closing-sections";
import { TrustStats, SecurityBadges, Testimonials, Faq } from "@/components/site/trust-sections";
import { LoginView, RegisterView } from "@/components/site/auth-views";
import { AdminLoginView, AdminPanelView } from "@/components/site/admin-views";
import { ClientDashboard } from "@/components/site/client-dashboard";
import { apiLogout, apiWhoami } from "@/lib/api";
import { INITIAL_ACTIVITY, INITIAL_COINS, STOCKS, tickCoin, type ActivityItem, type Coin } from "@/lib/market";
import { STRINGS, type Lang, type StringKey } from "@/lib/i18n";

type View = "home" | "login" | "register" | "client-dashboard" | "admin-login" | "admin-panel";

export default function Page() {
  const [view, setView] = useState<View>("home");
  const [lang, setLang] = useState<Lang>("en");
  const [coins, setCoins] = useState<Coin[]>(INITIAL_COINS);
  const [stocks, setStocks] = useState<Coin[]>(STOCKS);
  const [activity] = useState<ActivityItem[]>(INITIAL_ACTIVITY);
  const [hasClientSession, setHasClientSession] = useState(false);
  const [restored, setRestored] = useState(false);

  const t = useCallback((k: StringKey) => STRINGS[lang][k] ?? STRINGS.en[k], [lang]);

  // Simulated live market ticks (client-only, starts after mount)
  useEffect(() => {
    const id = setInterval(() => {
      setCoins((prev) => prev.map((c) => tickCoin(c)));
      setStocks((prev) => prev.map((s) => tickCoin(s)));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Restore sessions from bearer tokens (client portal + admin backoffice).
  // The server decides whether a token is valid — nothing is trusted locally.
  useEffect(() => {
    const restore = async () => {
      const adminHash = window.location.hash === "#admin";
      const who = await apiWhoami("client");
      if (who.authenticated) {
        setHasClientSession(true);
        setView("client-dashboard");
        setRestored(true);
        return;
      }
      if (adminHash) {
        const admin = await apiWhoami("admin");
        if (admin.authenticated) {
          setView("admin-panel");
          setRestored(true);
          return;
        }
        setView("admin-login");
      }
      setRestored(true);
    };
    restore();
  }, []);

  // Keep document title in sync with view (rendered as a hoisted <title> —
  // React 19 owns it, so it also survives the session-restore transition)
  const pageTitle =
    view === "login"
      ? `${t("signIn")} — CryptoWise`
      : view === "register"
        ? `${t("createAccount")} — CryptoWise`
        : view === "client-dashboard"
          ? `${t("clientPortal")} — CryptoWise`
          : view === "admin-login" || view === "admin-panel"
            ? `${t("adminBadge")} — CryptoWise`
            : "CryptoWise | Private Financial Platform";

  // Direct admin access via URL hash (#admin) — also survives reload
  useEffect(() => {
    const applyHash = () => {
      if (window.location.hash === "#admin") setView((v) => (v === "admin-panel" ? v : "admin-login"));
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const goHome = useCallback(() => {
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    setView("home");
  }, []);

  const goClientDashboard = useCallback(() => {
    setHasClientSession(true);
    window.scrollTo({ top: 0 });
    setView("client-dashboard");
  }, []);

  const signOutClient = useCallback(async () => {
    await apiLogout("client");
    setHasClientSession(false);
    setView("home");
  }, []);

  const goAdmin = useCallback(() => {
    window.location.hash = "admin";
    setView("admin-login");
  }, []);

  const goAdminPanel = useCallback(() => {
    window.location.hash = "admin";
    setView("admin-panel");
  }, []);

  const signOutAdmin = useCallback(async () => {
    await apiLogout("admin");
    goHome();
  }, [goHome]);

  const dir = useMemo(() => (lang === "ar" ? "rtl" : "ltr"), [lang]);

  return (
    <div dir={dir} className="min-h-screen flex flex-col bg-[#04121c] text-white [color-scheme:dark]">
      <title>{pageTitle}</title>
      {!restored ? (
        <div className="flex min-h-screen items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#00E5A0]/25 border-t-[#00E5A0]" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {view === "home" ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="flex min-h-screen flex-col"
            >
              <div className="bg-gradient-to-b from-[#04141d] to-[#020b12]">
                <Header
                  t={t}
                  lang={lang}
                  onLangToggle={() => setLang((l) => (l === "en" ? "ar" : "en"))}
                  onLogin={() => setView("login")}
                  onRegister={() => setView("register")}
                  onHome={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
                <Hero t={t} coins={coins} onRegister={() => setView("register")} onLogin={() => setView("login")} />
                <Ticker coins={[...coins, ...stocks]} />
              </div>
              <TrustStats t={t} />
              <TaglineStrip t={t} lang={lang} />
              <Pillars t={t} />
              <LiveMarket t={t} coins={coins} onRegister={() => setView("register")} />
              <StocksSection t={t} stocks={stocks} onRegister={() => setView("register")} />
              <Infrastructure t={t} onRegister={() => setView("register")} onLogin={() => setView("login")} />
              <TradingSection t={t} coins={coins} onLogin={() => setView("login")} />
              <AccountPreview t={t} />
              <WhyChooseUs t={t} onRegister={() => setView("register")} />
              <Steps t={t} onRegister={() => setView("register")} />
              <SecurityBadges t={t} />
              <SupportedCryptos t={t} coins={coins} activity={activity} />
              <SecuritySection t={t} />
              <Testimonials t={t} />
              <Faq t={t} />
              <FinalCta t={t} onRegister={() => setView("register")} onLogin={() => setView("login")} />
              <Footer t={t} onLogin={() => setView("login")} onRegister={() => setView("register")} onAdmin={goAdmin} />
            </motion.div>
          ) : view === "login" ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="flex min-h-screen flex-col"
            >
              <LoginView
                t={t}
                lang={lang}
                onBack={goHome}
                onSwitchToRegister={() => setView("register")}
                onAdminSuccess={goAdminPanel}
                onAdminGate={goAdmin}
                onClientSuccess={goClientDashboard}
              />
            </motion.div>
          ) : view === "register" ? (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="flex min-h-screen flex-col"
            >
              <RegisterView t={t} lang={lang} onBack={goHome} onSwitchToLogin={() => setView("login")} onClientSuccess={goClientDashboard} />
            </motion.div>
          ) : view === "client-dashboard" && hasClientSession ? (
            <motion.div
              key="client-dashboard"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="flex min-h-screen flex-col"
            >
              <ClientDashboard
                t={t}
                lang={lang}
                coins={coins}
                stocks={stocks}
                onLangToggle={() => setLang((l) => (l === "en" ? "ar" : "en"))}
                onSignOut={signOutClient}
              />
            </motion.div>
          ) : view === "admin-login" ? (
            <motion.div
              key="admin-login"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="flex min-h-screen flex-col"
            >
              <AdminLoginView t={t} lang={lang} onBack={goHome} onSuccess={() => setView("admin-panel")} />
            </motion.div>
          ) : view === "admin-panel" ? (
            <motion.div
              key="admin-panel"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="flex min-h-screen flex-col"
            >
              <AdminPanelView onSignOut={signOutAdmin} />
            </motion.div>
          ) : (
            <motion.div key="fallback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-screen flex-col">
              <div className="bg-gradient-to-b from-[#04141d] to-[#020b12]">
                <Header
                  t={t}
                  lang={lang}
                  onLangToggle={() => setLang((l) => (l === "en" ? "ar" : "en"))}
                  onLogin={() => setView("login")}
                  onRegister={() => setView("register")}
                  onHome={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
                <Hero t={t} coins={coins} onRegister={() => setView("register")} onLogin={() => setView("login")} />
                <Ticker coins={[...coins, ...stocks]} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
