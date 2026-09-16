"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Globe, Phone } from "lucide-react";
import { Logo } from "./icons";
import { SITE_PHONE_DISPLAY, SITE_PHONE_TEL } from "@/lib/contact";
import { cn } from "@/lib/utils";
import type { Lang, StringKey } from "@/lib/i18n";

const NAV_ITEMS: { key: StringKey; href: string }[] = [
  { key: "home", href: "#home" },
  { key: "features", href: "#features" },
  { key: "about", href: "#about" },
  { key: "pricing", href: "#trading" },
  { key: "blog", href: "#help" },
];

export function Header({
  t,
  lang,
  onLangToggle,
  onLogin,
  onRegister,
  onHome,
}: {
  t: (k: StringKey) => string;
  lang: Lang;
  onLangToggle: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onHome: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<StringKey>("home");

  const go = (href: string, key: StringKey) => {
    setOpen(false);
    setActive(key);
    onHome();
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      }, 60);
    });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#031019]/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Logo lang={lang} tagline={t("tagline")} onClick={onHome} />

          {/* desktop nav — active link carries the mint underline from the design */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => go(item.href, item.key)}
                className={cn(
                  "relative rounded-lg px-3.5 py-2 text-[13.5px] font-medium transition-colors",
                  active === item.key ? "text-white" : "text-white/55 hover:text-white hover:bg-white/[0.035]"
                )}
              >
                {t(item.key)}
                {active === item.key && (
                  <span className="absolute inset-x-3.5 -bottom-[5px] h-[2px] rounded-full bg-[#00E5A0] shadow-[0_0_10px_rgba(0,229,160,0.8)]" />
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* phone number (requested) */}
            <a
              href={SITE_PHONE_TEL}
              className="hidden xl:inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] font-semibold text-white/70 hover:text-[#00E5A0] hover:border-[#00E5A0]/30 transition-colors"
              aria-label={`${t("phone")}: ${SITE_PHONE_DISPLAY}`}
            >
              <Phone className="w-3.5 h-3.5 text-[#00E5A0]" />
              <span dir="ltr">{SITE_PHONE_DISPLAY}</span>
            </a>

            {/* language toggle */}
            <button
              onClick={onLangToggle}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] font-semibold text-white/70 hover:text-white hover:border-white/20 transition-colors"
              aria-label="Toggle language"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === "en" ? "EN" : "AR"}
            </button>

            <button
              onClick={onLogin}
              className="hidden md:inline-flex rounded-lg px-4 py-2 text-[13.5px] font-semibold text-white/80 hover:text-white transition-colors"
            >
              {t("login")}
            </button>
            <button
              onClick={onRegister}
              className="hidden md:inline-flex items-center rounded-lg bg-[#00E5A0] px-4 py-2 text-[13.5px] font-bold text-[#022c20] shadow-[0_0_24px_-6px_rgba(0,229,160,0.55)] hover:bg-[#2cf0b5] active:scale-[0.98] transition-all"
            >
              {t("getStarted")}
            </button>

            {/* menu button — rounded square as in the design, available on every viewport */}
            <button
              className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] w-10 h-10 text-white/85 hover:border-[#00E5A0]/30 hover:text-[#00E5A0] transition-colors"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? t("close") : t("menu")}
              aria-expanded={open}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* drop-down menu panel (all viewports, like the design's hamburger UI) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="overflow-hidden border-t border-white/[0.06] bg-[#04121c]/95 backdrop-blur-xl"
          >
            <nav className="px-4 py-3 flex flex-col" aria-label="Menu">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => go(item.href, item.key)}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-start text-sm font-medium transition-colors",
                    active === item.key ? "text-[#00E5A0] bg-[#00E5A0]/[0.07]" : "text-white/70 hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  {t(item.key)}
                </button>
              ))}

              <a
                href={SITE_PHONE_TEL}
                className="mt-2 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm font-semibold text-white/80 hover:text-[#00E5A0] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#00E5A0]" />
                <span dir="ltr">{SITE_PHONE_DISPLAY}</span>
              </a>

              <div className="mt-2 flex items-center gap-2 border-t border-white/[0.06] pt-3">
                <button
                  onClick={() => {
                    setOpen(false);
                    onLangToggle();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] font-semibold text-white/70"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {lang === "en" ? "EN" : "AR"}
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    onLogin();
                  }}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-[13.5px] font-semibold text-white/85"
                >
                  {t("login")}
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    onRegister();
                  }}
                  className="flex-1 rounded-lg bg-[#00E5A0] px-4 py-2 text-[13.5px] font-bold text-[#022c20]"
                >
                  {t("getStarted")}
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
