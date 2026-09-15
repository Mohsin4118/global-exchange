"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "@/components/site/header";
import { Hero } from "@/components/site/hero";
import { Pillars, Ticker, LiveMarket } from "@/components/site/market-sections";
import { Infrastructure, TradingSection, WhyChooseUs, Steps } from "@/components/site/trading-sections";
import { SupportedCryptos, SecuritySection, FinalCta, Footer } from "@/components/site/closing-sections";
import { TrustStats, SecurityBadges, Testimonials, Faq } from "@/components/site/trust-sections";
import { LoginView, RegisterView } from "@/components/site/auth-views";
import { AdminLoginView, AdminPanelView } from "@/components/site/admin-views";
import { INITIAL_ACTIVITY, INITIAL_COINS, tickCoin, type ActivityItem, type Coin } from "@/lib/market";
import { STRINGS, type Lang, type StringKey } from "@/lib/i18n";

type View = "home" | "login" | "register" | "admin-login" | "admin-panel";

export default function Page() {
  const [view, setView] = useState<View>("home");
  const [lang, setLang] = useState<Lang>("en");
  const [coins, setCoins] = useState<Coin[]>(INITIAL_COINS);
  const [activity] = useState<ActivityItem[]>(INITIAL_ACTIVITY);

  const t = useCallback((k: StringKey) => STRINGS[lang][k] ?? STRINGS.en[k], [lang]);

  // Simulated live market ticks (client-only, starts after mount)
  useEffect(() => {
    const id = setInterval(() => {
      setCoins((prev) => prev.map((c) => tickCoin(c)));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Keep document title in sync with view
  useEffect(() => {
    document.title =
      view === "login"
        ? `${t("signIn")} — Global Exchange`
        : view === "register"
          ? `${t("createAccount")} — Global Exchange`
          : view === "admin-login" || view === "admin-panel"
            ? `${t("adminBadge")} — Global Exchange`
            : "Global Exchange | Private Financial Platform";
  }, [view, t]);

  const goHome = useCallback(() => setView("home"), []);

  const dir = useMemo(() => (lang === "ar" ? "rtl" : "ltr"), [lang]);

  return (
    <div dir={dir} className="min-h-screen flex flex-col bg-[#04121c] text-white [color-scheme:dark]">
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
              <Ticker coins={coins} />
            </div>
            <TrustStats t={t} />
            <Pillars t={t} />
            <LiveMarket t={t} coins={coins} onRegister={() => setView("register")} />
            <Infrastructure t={t} onRegister={() => setView("register")} onLogin={() => setView("login")} />
            <TradingSection t={t} coins={coins} onLogin={() => setView("login")} />
            <WhyChooseUs t={t} onRegister={() => setView("register")} />
            <Steps t={t} onRegister={() => setView("register")} />
            <SecurityBadges t={t} />
            <SupportedCryptos t={t} coins={coins} activity={activity} />
            <SecuritySection t={t} />
            <Testimonials t={t} />
            <Faq t={t} />
            <FinalCta t={t} onRegister={() => setView("register")} onLogin={() => setView("login")} />
            <Footer t={t} onLogin={() => setView("login")} onRegister={() => setView("register")} onAdmin={() => setView("admin-login")} />
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
            <LoginView t={t} lang={lang} onBack={goHome} onSwitchToRegister={() => setView("register")} />
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
            <RegisterView t={t} lang={lang} onBack={goHome} onSwitchToLogin={() => setView("login")} />
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
        ) : (
          <motion.div
            key="admin-panel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="flex min-h-screen flex-col"
          >
            <AdminPanelView onSignOut={goHome} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
