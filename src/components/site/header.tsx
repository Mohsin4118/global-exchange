"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Globe, Phone, ChevronDown, Check } from "lucide-react";
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

/* Header language selector — real switcher (RTL + full translation).
   Sits in the header bar between the CryptoWise brand and the hamburger
   menu, on every viewport. */
const LANGUAGES: Array<{ code: Lang; short: string; label: string }> = [
  { code: "en", short: "EN", label: "English" },
  { code: "ar", short: "AR", label: "العربية" },
];

export function Header({
  t,
  lang,
  onLangSelect,
  onLogin,
  onRegister,
  onHome,
}: {
  t: (k: StringKey) => string;
  lang: Lang;
  onLangSelect: (l: Lang) => void;
  onLogin: () => void;
  onRegister: () => void;
  onHome: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<StringKey>("home");
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // close the language dropdown on outside click / Escape
  useEffect(() => {
    if (!langOpen) return;
    const onDoc = (e: PointerEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLangOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [langOpen]);

  const pickLang = (l: Lang) => {
    setLangOpen(false);
    if (l !== lang) onLangSelect(l);
  };

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

            {/* language selector — header bar, between brand and hamburger,
                directly beside the menu button (mirrors naturally in RTL);
                visible on every viewport */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 sm:px-3 py-2 text-[13px] font-semibold text-white/70 hover:text-white hover:border-white/20 transition-colors"
                aria-label="Select language"
                aria-haspopup="menu"
                aria-expanded={langOpen}
              >
                <Globe className="w-3.5 h-3.5" />
                <span dir="ltr">{lang === "en" ? "EN" : "AR"}</span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", langOpen && "rotate-180")} />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    role="menu"
                    aria-label="Language"
                    className="absolute end-0 top-full mt-2 w-44 max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-[#04121c]/95 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl"
                  >
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        role="menuitemradio"
                        aria-checked={lang === l.code}
                        onClick={() => pickLang(l.code)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors",
                          lang === l.code ? "bg-[#00E5A0]/[0.08] text-[#00E5A0]" : "text-white/70 hover:bg-white/[0.05] hover:text-white",
                        )}
                      >
                        <span className="flex flex-col items-start leading-tight">
                          <span dir="auto">{l.label}</span>
                          <span className="text-[11px] text-white/40" dir="ltr">
                            {l.short}
                          </span>
                        </span>
                        {lang === l.code && <Check className="h-4 w-4 shrink-0" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* menu button — rounded square as in the design, available on every viewport */}
            <button
              className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] w-10 h-10 text-white/85 hover:border-[#00E5A0]/30 hover:text-[#00E5A0] transition-colors"
              onClick={() => {
                setOpen((v) => !v);
                setLangOpen(false);
              }}
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
