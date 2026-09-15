"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Phone, ShieldCheck, User } from "lucide-react";
import { Logo } from "./icons";
import { useToast } from "@/hooks/use-toast";
import { ADMIN_EMAIL, isAdminCredentials } from "@/lib/admin-auth";
import type { Lang, StringKey } from "@/lib/i18n";

export function LoginView({
  t,
  lang,
  onBack,
  onSwitchToRegister,
  onAdminSuccess,
  onAdminGate,
}: {
  t: (k: StringKey) => string;
  lang: Lang;
  onBack: () => void;
  onSwitchToRegister: () => void;
  onAdminSuccess?: () => void;
  onAdminGate?: () => void;
}) {
  const title = t("welcomeBack");
  const subtitle = t("signInToAccess");
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({ title: t("fillAllFields"), variant: "destructive" });
      return;
    }
    // Super Admin credentials typed into the client login → straight to the backoffice
    if (email.trim().toLowerCase() === ADMIN_EMAIL) {
      if (isAdminCredentials(email, password)) {
        onAdminSuccess?.();
        return;
      }
      toast({ title: t("adminWrong"), variant: "destructive" });
      return;
    }
    toast({ title: t("signedInToast") });
  };

  return (
    <AuthShell t={t} lang={lang} onBack={onBack} title={title} subtitle={subtitle}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field
          icon={<Mail className="h-4 w-4" />}
          label={t("emailAddress")}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="name@example.com"
          autoComplete="email"
        />
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[12.5px] font-medium text-white/60">{t("password")}</label>
            <button type="button" onClick={() => toast({ title: t("forgotPassword") })} className="text-[12px] font-medium text-[#00E5A0] hover:underline">
              {t("forgotPassword")}
            </button>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 start-3 flex items-center text-white/30">
              <Lock className="h-4 w-4" />
            </span>
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] ps-10 pe-10 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#00E5A0]/50 focus:ring-2 focus:ring-[#00E5A0]/15 transition"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute inset-y-0 end-3 flex items-center text-white/30 hover:text-white/60"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-white/60">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[#00E5A0]"
          />
          {t("rememberMe")}
        </label>

        <button
          type="submit"
          className="mt-1 h-12 rounded-xl bg-[#00E5A0] text-[15px] font-bold text-[#022c20] shadow-[0_8px_32px_-8px_rgba(0,229,160,0.6)] hover:bg-[#2cf0b5] active:scale-[0.99] transition-all"
        >
          {t("signIn")}
        </button>

        <p className="text-center text-[13.5px] text-white/50">
          {t("noAccount")}{" "}
          <button type="button" onClick={onSwitchToRegister} className="font-semibold text-[#00E5A0] hover:underline">
            {t("createOne")}
          </button>
        </p>

        {onAdminGate && (
          <button
            type="button"
            onClick={onAdminGate}
            className="mx-auto mt-1 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] font-semibold text-white/45 hover:text-red-400 hover:border-red-400/30 transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("adminBadge")}
          </button>
        )}
      </form>
    </AuthShell>
  );
}

export function RegisterView({
  t,
  lang,
  onBack,
  onSwitchToLogin,
}: {
  t: (k: StringKey) => string;
  lang: Lang;
  onBack: () => void;
  onSwitchToLogin: () => void;
}) {
  const title = t("createYourAccount");
  const subtitle = t("fillDetails");
  const { toast } = useToast();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!first.trim() || !last.trim() || !email.trim() || !password.trim() || !confirm.trim()) {
      toast({ title: t("fillAllFields"), variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: t("passwordsMismatch"), variant: "destructive" });
      return;
    }
    toast({ title: t("registeredToast") });
  };

  return (
    <AuthShell t={t} lang={lang} onBack={onBack} title={title} subtitle={subtitle}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field icon={<User className="h-4 w-4" />} label={t("firstName")} value={first} onChange={setFirst} placeholder="John" autoComplete="given-name" required />
          <Field icon={<User className="h-4 w-4" />} label={t("lastName")} value={last} onChange={setLast} placeholder="Smith" autoComplete="family-name" required />
        </div>
        <Field icon={<Mail className="h-4 w-4" />} label={t("emailAddress")} type="email" value={email} onChange={setEmail} placeholder="name@example.com" autoComplete="email" required />
        <Field icon={<Phone className="h-4 w-4" />} label={`${t("phone")} (${t("optional")})`} type="tel" value={phone} onChange={setPhone} placeholder="+44 ..." autoComplete="tel" />
        <Field icon={<Lock className="h-4 w-4" />} label={t("password")} type="password" value={password} onChange={setPassword} placeholder="••••••••" autoComplete="new-password" required />
        <Field icon={<Lock className="h-4 w-4" />} label={t("confirmPassword")} type="password" value={confirm} onChange={setConfirm} placeholder="••••••••" autoComplete="new-password" required />

        <button
          type="submit"
          className="mt-1 h-12 rounded-xl bg-[#00E5A0] text-[15px] font-bold text-[#022c20] shadow-[0_8px_32px_-8px_rgba(0,229,160,0.6)] hover:bg-[#2cf0b5] active:scale-[0.99] transition-all"
        >
          {t("createAccount")}
        </button>

        <p className="text-center text-[13.5px] text-white/50">
          {t("haveAccount")}{" "}
          <button type="button" onClick={onSwitchToLogin} className="font-semibold text-[#00E5A0] hover:underline">
            {t("signIn")}
          </button>
        </p>
      </form>
      <p className="mt-5 text-center text-[11.5px] leading-relaxed text-white/35">{t("dataProtected")}</p>
    </AuthShell>
  );
}

function Field({
  icon,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
}: {
  icon: React.ReactNode;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-medium text-white/60">
        {label} {required && <span className="text-[#00E5A0]">*</span>}
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 start-3 flex items-center text-white/30">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] ps-10 pe-4 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#00E5A0]/50 focus:ring-2 focus:ring-[#00E5A0]/15 transition"
        />
      </div>
    </div>
  );
}

function AuthShell({
  t,
  lang,
  onBack,
  title,
  subtitle,
  children,
}: {
  t: (k: StringKey) => string;
  lang: Lang;
  onBack: () => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#04121c]">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 start-1/3 h-[420px] w-[420px] rounded-full bg-[#00E5A0]/[0.06] blur-[130px]" />
        <div className="absolute bottom-0 end-10 h-[320px] w-[320px] rounded-full bg-teal-400/[0.04] blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-white/[0.06] bg-[#031019]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo lang={lang} tagline={t("tagline")} onClick={onBack} />
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
          <div className="rounded-2xl border border-white/[0.08] bg-[#071923]/90 p-6 sm:p-8 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)]">
            <div className="mb-6 text-center">
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#00E5A0]/12 text-[#00E5A0]">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">{title}</h1>
              <p className="mt-1.5 text-[13.5px] text-white/50">{subtitle}</p>
            </div>
            {children}
          </div>
          <p className="mt-5 text-center text-[11.5px] text-white/30">{t("privatePortal")}</p>
        </motion.div>
      </main>
    </div>
  );
}


