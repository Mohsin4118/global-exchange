"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Info, ArrowLeft } from "lucide-react";
import { LogoMark } from "./icons";
import { useToast } from "@/hooks/use-toast";
import type { Lang, StringKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Backoffice } from "@/components/admin/shell";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "@/lib/admin-auth";

/* ---------------- Admin login ---------------- */

export function AdminLoginView({
  t,
  lang,
  onBack,
  onSuccess,
}: {
  t: (k: StringKey) => string;
  lang: Lang;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
      toast({ title: t("adminWrong"), variant: "destructive" });
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#04121c]">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 start-1/3 h-[420px] w-[420px] rounded-full bg-amber-400/[0.05] blur-[130px]" />
        <div className="absolute bottom-0 end-10 h-[320px] w-[320px] rounded-full bg-[#00E5A0]/[0.04] blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-white/[0.06] bg-[#031019]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <LogoMark className="h-10 w-10" />
            <span className="rounded-md bg-amber-400/12 px-2 py-0.5 text-[11px] font-bold text-amber-400">{t("adminBadge")}</span>
          </div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-[13px] font-semibold text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t("backHome")}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-amber-400/15 bg-[#071923]/90 p-6 sm:p-8 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)]">
            <div className="mb-6 text-center">
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/12 text-amber-400">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">{t("adminLoginTitle")}</h1>
              <p className="mt-1.5 text-[13px] text-white/50">{t("adminLoginSub")}</p>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-white/60">{t("emailAddress")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cryptowiseuk.com"
                  autoComplete="email"
                  className={cn(
                    "h-11 w-full rounded-xl border bg-white/[0.03] px-4 text-sm text-white placeholder:text-white/25 outline-none focus:ring-2 transition",
                    error ? "border-amber-400/50 focus:ring-amber-400/15" : "border-white/10 focus:border-amber-400/40 focus:ring-amber-400/10"
                  )}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-white/60">{t("password")}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  className={cn(
                    "h-11 w-full rounded-xl border bg-white/[0.03] px-4 text-sm text-white placeholder:text-white/25 outline-none focus:ring-2 transition",
                    error ? "border-amber-400/50 focus:ring-amber-400/15" : "border-white/10 focus:border-amber-400/40 focus:ring-amber-400/10"
                  )}
                />
                {error && <p className="mt-1.5 text-[12px] font-medium text-amber-400">{t("adminWrong")}</p>}
              </div>

              <button
                type="submit"
                className="mt-1 h-12 rounded-xl bg-amber-400 text-[15px] font-bold text-[#2a1a02] shadow-[0_8px_32px_-8px_rgba(251,191,36,0.5)] hover:bg-amber-300 active:scale-[0.99] transition-all"
              >
                {t("signIn")}
              </button>
            </form>

            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
              <p className="text-[11.5px] leading-relaxed text-white/45" dir="ltr">
                <span className="font-bold text-white/60">{t("adminHint")}:</span> {ADMIN_EMAIL} / {ADMIN_PASSWORD}
              </p>
            </div>
          </div>
          <p className="mt-5 text-center text-[11.5px] text-white/30">{t("privatePortal")}</p>
        </motion.div>
      </main>
      <span className="hidden">{lang}</span>
    </div>
  );
}

/* ---------------- Admin panel (full backoffice replica) ---------------- */

export function AdminPanelView({ onSignOut }: { t?: (k: StringKey) => string; onSignOut: () => void }) {
  return <Backoffice onSignOut={onSignOut} />;
}
