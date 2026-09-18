"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Globe, Lock, Mail, MapPin, Phone, ShieldCheck, Sparkles, User } from "lucide-react";
import { Logo } from "./icons";
import { useToast } from "@/hooks/use-toast";
import { PasswordInput } from "@/components/ui/password-input";
import { ADMIN_EMAIL } from "@/lib/admin-auth";
import { apiAdminLogin, apiClientLogin, apiRegister } from "@/lib/api";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/admin-auth";
import type { Lang, StringKey } from "@/lib/i18n";

export function LoginView({
  t,
  lang,
  onBack,
  onSwitchToRegister,
  onAdminSuccess,
  onAdminGate,
  onClientSuccess,
}: {
  t: (k: StringKey) => string;
  lang: Lang;
  onBack: () => void;
  onSwitchToRegister: () => void;
  onAdminSuccess?: () => void;
  onAdminGate?: () => void;
  onClientSuccess?: () => void;
}) {
  const title = t("welcomeBack");
  const subtitle = t("signInToAccess");
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || busy) {
      toast({ title: t("fillAllFields"), variant: "destructive" });
      return;
    }
    setBusy(true);
    // Super Admin credentials typed into the client login → straight to the backoffice
    if (email.trim().toLowerCase() === ADMIN_EMAIL) {
      const res = await apiAdminLogin(email.trim(), password);
      setBusy(false);
      if (res.ok) {
        onAdminSuccess?.();
      } else {
        toast({ title: t("adminWrong"), variant: "destructive" });
      }
      return;
    }
    // Client portal account (demo or created by the Super Admin in the CRM)
    const res = await apiClientLogin(email.trim(), password);
    setBusy(false);
    if (res.ok) {
      onClientSuccess?.();
      return;
    }
    // account states are enforced server-side: a PENDING or REJECTED
    // registration request can never reach the Client Dashboard
    toast({
      title:
        res.error === "suspended"
          ? t("suspendedBanner")
          : res.error === "pending"
            ? t("loginPending")
            : res.error === "rejected"
              ? t("loginRejected")
              : t("invalidCredentials"),
      variant: "destructive",
    });
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
            <label className="text-[0.78125rem] font-medium text-slate-600">{t("password")}</label>
            <button type="button" onClick={() => toast({ title: t("forgotPassword") })} className="text-[0.75rem] font-medium text-emerald-600 hover:underline">
              {t("forgotPassword")}
            </button>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 start-3 flex items-center text-slate-400">
              <Lock className="h-4 w-4" />
            </span>
            <PasswordInput
              theme="light"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete="current-password"
              className="[&_input]:ps-10"
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-[0.8125rem] text-slate-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 bg-white accent-[#00E5A0]"
          />
          {t("rememberMe")}
        </label>

        <button
          type="submit"
          disabled={busy}
          className="mt-1 h-12 rounded-xl bg-[#00E5A0] text-[0.9375rem] font-bold text-[#022c20] shadow-[0_8px_32px_-8px_rgba(0,229,160,0.6)] hover:bg-[#2cf0b5] active:scale-[0.99] transition-all disabled:opacity-60"
        >
          {busy ? "…" : t("signIn")}
        </button>

        {onClientSuccess && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[0.71875rem] font-bold uppercase tracking-wide text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                {t("demoAccess")}
              </span>
              <button
                type="button"
                onClick={() => {
                  setEmail(DEMO_EMAIL);
                  setPassword(DEMO_PASSWORD);
                }}
                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[0.71875rem] font-bold text-white hover:bg-emerald-700 transition-colors"
              >
                {t("demoUse")}
              </button>
            </div>
            <p className="mt-2 font-mono text-[0.71875rem] leading-relaxed text-slate-600" dir="ltr">
              {DEMO_EMAIL} · {DEMO_PASSWORD}
            </p>
          </div>
        )}

        <p className="text-center text-[0.84375rem] text-slate-500">
          {t("noAccount")}{" "}
          <button type="button" onClick={onSwitchToRegister} className="font-semibold text-emerald-600 hover:underline">
            {t("createOne")}
          </button>
        </p>

        {onAdminGate && (
          <button
            type="button"
            onClick={onAdminGate}
            className="mx-auto mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[0.75rem] font-semibold text-slate-500 hover:text-amber-600 hover:border-amber-300 transition-colors"
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
  onClientSuccess?: () => void;
}) {
  const title = t("createYourAccount");
  const subtitle = t("fillDetails");
  const { toast } = useToast();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  // a submitted registration becomes a PENDING ACCOUNT REQUEST — never an
  // active session. The panel replaces the form once the request is in.
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!first.trim() || !last.trim() || !email.trim() || !password.trim() || !confirm.trim() || busy) {
      toast({ title: t("fillAllFields"), variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: t("passwordsMismatch"), variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: t("weakPassword"), variant: "destructive" });
      return;
    }
    setBusy(true);
    const res = await apiRegister(`${first.trim()} ${last.trim()}`, email.trim(), password, phone.trim(), country.trim(), address.trim());
    setBusy(false);
    if (!res.ok) {
      toast({ title: res.error === "taken" ? t("emailAlreadyUsed") : t("weakPassword"), variant: "destructive" });
      return;
    }
    setSubmitted(true);
  };

  return (
    <AuthShell t={t} lang={lang} onBack={onBack} title={title} subtitle={subtitle}>
      {submitted ? (
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-xl font-bold text-slate-900">{t("regPendingTitle")}</h2>
          <p className="mt-2 text-[0.875rem] leading-relaxed text-slate-500">{t("regPendingBody")}</p>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="mt-5 h-11 w-full rounded-xl bg-[#00E5A0] text-[0.9375rem] font-bold text-[#022c20] shadow-[0_8px_32px_-8px_rgba(0,229,160,0.6)] hover:bg-[#2cf0b5] transition-all"
          >
            {t("signIn")}
          </button>
          <button type="button" onClick={onBack} className="mt-2.5 h-10 w-full rounded-xl border border-slate-200 bg-white text-[0.875rem] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            {t("backHome")}
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Field icon={<User className="h-4 w-4" />} label={t("firstName")} value={first} onChange={setFirst} placeholder="John" autoComplete="given-name" required />
              <Field icon={<User className="h-4 w-4" />} label={t("lastName")} value={last} onChange={setLast} placeholder="Smith" autoComplete="family-name" required />
            </div>
            <Field icon={<Mail className="h-4 w-4" />} label={t("emailAddress")} type="email" value={email} onChange={setEmail} placeholder="name@example.com" autoComplete="email" required />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field icon={<Phone className="h-4 w-4" />} label={`${t("phone")} (${t("optional")})`} type="tel" value={phone} onChange={setPhone} placeholder="+44 ..." autoComplete="tel" />
              <Field icon={<Globe className="h-4 w-4" />} label={`${t("regCountry")} (${t("optional")})`} value={country} onChange={setCountry} placeholder="United Kingdom" autoComplete="country-name" />
            </div>
            <Field icon={<MapPin className="h-4 w-4" />} label={`${t("regAddress")} (${t("optional")})`} value={address} onChange={setAddress} placeholder="12 Kingsway Mews, London" autoComplete="street-address" />
            <div>
              <label className="mb-1.5 block text-[0.78125rem] font-medium text-slate-600">
                {t("password")} <span className="text-emerald-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 start-3 flex items-center text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <PasswordInput theme="light" value={password} onChange={setPassword} placeholder="••••••••" autoComplete="new-password" className="[&_input]:ps-10" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[0.78125rem] font-medium text-slate-600">
                {t("confirmPassword")} <span className="text-emerald-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 start-3 flex items-center text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <PasswordInput theme="light" value={confirm} onChange={setConfirm} placeholder="••••••••" autoComplete="new-password" className="[&_input]:ps-10" />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-1 h-12 rounded-xl bg-[#00E5A0] text-[0.9375rem] font-bold text-[#022c20] shadow-[0_8px_32px_-8px_rgba(0,229,160,0.6)] hover:bg-[#2cf0b5] active:scale-[0.99] transition-all disabled:opacity-60"
            >
              {busy ? "…" : t("createAccount")}
            </button>

            <p className="rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-[0.78125rem] leading-relaxed text-amber-800">{t("regRequestNote")}</p>

            <p className="text-center text-[0.84375rem] text-slate-500">
              {t("haveAccount")}{" "}
              <button type="button" onClick={onSwitchToLogin} className="font-semibold text-emerald-600 hover:underline">
                {t("signIn")}
              </button>
            </p>
          </form>
          <p className="mt-5 text-center text-[0.71875rem] leading-relaxed text-slate-400">{t("dataProtected")}</p>
        </>
      )}
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
      <label className="mb-1.5 block text-[0.78125rem] font-medium text-slate-600">
        {label} {required && <span className="text-emerald-600">*</span>}
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 start-3 flex items-center text-slate-400">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white ps-10 pe-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15 transition"
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f5f7fa] [color-scheme:light]">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 start-1/3 h-[420px] w-[420px] rounded-full bg-emerald-300/25 blur-[130px]" />
        <div className="absolute bottom-0 end-10 h-[320px] w-[320px] rounded-full bg-teal-300/25 blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo lang={lang} tagline={t("tagline")} onClick={onBack} tone="light" />
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[0.8125rem] font-semibold text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
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
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_30px_80px_-32px_rgba(15,23,42,0.28)]">
            <div className="mb-6 text-center">
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
              <p className="mt-1.5 text-[0.84375rem] text-slate-500">{subtitle}</p>
            </div>
            {children}
          </div>
          <p className="mt-5 text-center text-[0.71875rem] text-slate-400">{t("privatePortal")}</p>
        </motion.div>
      </main>
    </div>
  );
}
