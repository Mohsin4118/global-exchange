"use client";

import { useState } from "react";
import { Menu, X, Globe } from "lucide-react";
import { Logo } from "./icons";
import { cn } from "@/lib/utils";
import type { Lang, StringKey } from "@/lib/i18n";

const NAV_ITEMS: { key: StringKey; href: string }[] = [
  { key: "home", href: "#home" },
  { key: "markets", href: "#markets" },
  { key: "trading", href: "#trading" },
  { key: "investing", href: "#investing" },
  { key: "about", href: "#about" },
  { key: "help", href: "#help" },
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

  const go = (href: string) => {
    setOpen(false);
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

          {/* desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => go(item.href)}
                className="rounded-lg px-3.5 py-2 text-[13.5px] font-medium text-white/60 hover:text-white hover:bg-white/[0.035] transition-colors"
              >
                {t(item.key)}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
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
              className="hidden sm:inline-flex rounded-lg px-4 py-2 text-[13.5px] font-semibold text-white/80 hover:text-white transition-colors"
            >
              {t("login")}
            </button>
            <button
              onClick={onRegister}
              className="hidden sm:inline-flex items-center rounded-lg bg-[#00E5A0] px-4 py-2 text-[13.5px] font-bold text-[#022c20] shadow-[0_0_24px_-6px_rgba(0,229,160,0.55)] hover:bg-[#2cf0b5] active:scale-[0.98] transition-all"
            >
              {t("getStarted")}
            </button>

            {/* mobile menu button */}
            <button
              className="lg:hidden inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] w-10 h-10 text-white/80"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? t("close") : t("menu")}
              aria-expanded={open}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* mobile panel */}
      <div
        className={cn(
          "lg:hidden overflow-hidden border-t border-white/[0.06] bg-[#04121c]/95 backdrop-blur-xl transition-[max-height,opacity] duration-300",
          open ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="px-4 py-3 flex flex-col" aria-label="Mobile">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => go(item.href)}
              className="rounded-lg px-3 py-2.5 text-start text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.04]"
            >
              {t(item.key)}
            </button>
          ))}
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
      </div>
    </header>
  );
}
