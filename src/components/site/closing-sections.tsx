"use client";

import { motion } from "framer-motion";
import { Fingerprint, Lock, ScanLine, ServerCog, EyeOff, Mail, MessageCircle, Send, Phone } from "lucide-react";
import { CoinBadge, LogoMark } from "./icons";
import { formatChange, formatPrice, type ActivityItem, type Coin } from "@/lib/market";
import type { StringKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ---------------- Supported cryptos + activity ---------------- */

export function SupportedCryptos({
  t,
  coins,
  activity,
}: {
  t: (k: StringKey) => string;
  coins: Coin[];
  activity: ActivityItem[];
}) {
  return (
    <section className="border-y border-white/[0.05] bg-[#020b12]/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-[12.5px] font-semibold uppercase tracking-[0.18em] text-[#00E5A0]">
            {t("supportedTitle")}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">{t("supportedHeading")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">{t("supportedSub")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="mx-auto mt-10 max-w-3xl rounded-2xl border border-white/[0.08] bg-[#071923]/90 p-5 sm:p-6 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.8)]"
        >
          {/* coin tabs */}
          <div className="flex flex-wrap gap-2" dir="ltr">
            {coins.slice(0, 4).map((c, i) => (
              <span
                key={c.id}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11.5px] font-semibold",
                  i === 0 ? "bg-white/10 text-white" : "text-white/40"
                )}
              >
                {c.symbol.toLowerCase()}
                <span className={c.change24h >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {formatChange(c.change24h)}
                </span>
              </span>
            ))}
          </div>

          {/* featured price row */}
          <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-3">
              <CoinBadge glyph={coins[0].glyph} gradient={coins[0].gradient} className="h-10 w-10 text-base" />
              <div>
                <p className="text-[13px] font-semibold text-white/85">{coins[0].name}</p>
                <p className="font-mono text-[10.5px] text-white/35">{coins[0].symbol}</p>
              </div>
            </div>
            <div className="text-end">
              <p className="font-mono text-2xl font-bold text-white tabular-nums">{formatPrice(coins[0].price)}</p>
              <p
                className={cn(
                  "font-mono text-[12px] font-semibold tabular-nums",
                  coins[0].change24h >= 0 ? "text-emerald-400" : "text-red-400"
                )}
              >
                {formatChange(coins[0].change24h)} 24h
              </p>
            </div>
          </div>

          {/* mini bars */}
          <div className="mt-5 flex h-14 items-end gap-1.5" dir="ltr" aria-hidden="true">
            {[34, 48, 40, 56, 44, 62, 52, 70, 58, 66, 74, 60, 78, 68, 82, 72, 64, 76, 84, 70].map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-sm bg-gradient-to-t from-[#00E5A0]/25 to-[#00E5A0]/70"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>

          {/* activity */}
          <div className="mt-6 border-t border-white/[0.06] pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">{t("recentActivity")}</p>
            <div className="mt-3 flex flex-col gap-2">
              {activity.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5"
                  dir="ltr"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-[12px] font-bold text-white/80">{a.route}</span>
                    <span className="truncate font-mono text-[11px] text-white/40">{a.amount}</span>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold",
                      a.status === "Completed" ? "bg-emerald-400/12 text-emerald-400" : "bg-amber-400/12 text-amber-400"
                    )}
                  >
                    {a.status === "Completed" ? t("completed") : t("processing")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- Security ---------------- */

export function SecuritySection({ t }: { t: (k: StringKey) => string }) {
  const cards = [
    { icon: Fingerprint, title: t("secureAuth"), desc: t("secureAuthDesc") },
    { icon: Lock, title: t("accountProtection"), desc: t("accountProtectionDesc") },
    { icon: ScanLine, title: t("transactionMonitoring"), desc: t("transactionMonitoringDesc") },
    { icon: ServerCog, title: t("protectedInfra"), desc: t("protectedInfraDesc") },
    { icon: EyeOff, title: t("privacyFocused"), desc: t("privacyFocusedDesc") },
  ];
  return (
    <section id="about" className="scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-[12.5px] font-semibold uppercase tracking-[0.18em] text-[#00E5A0]">
            {t("aboutSecurity")}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">{t("securityTitle")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-white/55">{t("securitySub")}</p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className={cn(
                "rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 hover:border-[#00E5A0]/25 transition-colors",
                i === 4 && "sm:col-span-2 lg:col-span-1"
              )}
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#00E5A0]/12 text-[#00E5A0]">
                <c.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-[16px] font-semibold text-white">{c.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/50">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */

export function FinalCta({ t, onRegister, onLogin }: { t: (k: StringKey) => string; onRegister: () => void; onLogin: () => void }) {
  return (
    <section id="help" className="scroll-mt-20 border-t border-white/[0.05] bg-[#020b12]/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65 }}
        >
          <LogoMark className="mx-auto h-14 w-14" />
          <h2 className="mt-6 text-3xl sm:text-4xl font-bold tracking-tight text-white">{t("ctaTitle")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">{t("ctaSub")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onRegister}
              className="rounded-xl bg-[#00E5A0] px-7 py-3.5 text-[14.5px] font-bold text-[#022c20] shadow-[0_8px_32px_-8px_rgba(0,229,160,0.6)] hover:bg-[#2cf0b5] active:scale-[0.98] transition-all"
            >
              {t("getStarted")}
            </button>
            <button
              onClick={onLogin}
              className="rounded-xl border border-white/12 bg-white/[0.04] px-7 py-3.5 text-[14.5px] font-semibold text-white/85 hover:bg-white/[0.08] transition-colors"
            >
              {t("login")}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */

export function Footer({
  t,
  onLogin,
  onRegister,
}: {
  t: (k: StringKey) => string;
  onLogin: () => void;
  onRegister: () => void;
}) {
  const year = 2026;
  return (
    <footer className="mt-auto border-t border-white/[0.06] bg-[#01060b]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        {/* regulatory notes */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h4 className="text-[13px] font-bold text-white/85">{t("fcaTitle")}</h4>
            <p className="mt-2 text-[11.5px] leading-relaxed text-white/40">{t("fcaText")}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h4 className="text-[13px] font-bold text-white/85">{t("riskTitle")}</h4>
            <p className="mt-2 text-[11.5px] leading-relaxed text-white/40">{t("riskText")}</p>
          </div>
        </div>

        <div className="mt-10 grid gap-10 md:grid-cols-5">
          {/* brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <LogoMark className="h-10 w-10" />
              <div className="leading-tight">
                <p className="font-semibold text-white">Global Exchange</p>
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#00E5A0]/80">{t("tagline")}</p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-white/45">{t("footerAbout")}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href="mailto:support@globexchange.co.uk"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] font-medium text-white/70 hover:text-[#00E5A0] hover:border-[#00E5A0]/30 transition-colors"
              >
                <Mail className="h-3.5 w-3.5" /> support@globexchange.co.uk
              </a>
              <a
                href="https://wa.me/447591274617"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 text-white/70 hover:text-[#00E5A0] hover:border-[#00E5A0]/30 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a
                href="https://t.me/+447591274617"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 text-white/70 hover:text-[#00E5A0] hover:border-[#00E5A0]/30 transition-colors"
              >
                <Send className="h-4 w-4" />
              </a>
              <a
                href="tel:+447591274617"
                aria-label="Phone"
                className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 text-white/70 hover:text-[#00E5A0] hover:border-[#00E5A0]/30 transition-colors"
              >
                <Phone className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* platform */}
          <FooterCol title={t("platform")}>
            <FooterLink label={t("markets")} href="#markets" />
            <FooterLink label={t("trading")} href="#trading" />
            <FooterLink label={t("investing")} href="#investing" />
            <FooterLink label={t("about")} href="#about" />
          </FooterCol>

          {/* account */}
          <FooterCol title={t("account")}>
            <FooterLink label={t("login")} onClick={onLogin} />
            <FooterLink label={t("createAccount")} onClick={onRegister} />
          </FooterCol>

          {/* help */}
          <FooterCol title={t("footerHelp")}>
            <FooterLink label={t("contactSupport")} href="mailto:support@globexchange.co.uk" />
            <FooterLink label={t("security")} href="#about" />
          </FooterCol>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/[0.06] pt-6">
          <p className="text-[12px] text-white/35">
            © {year} Global Exchange. {t("rights")}
          </p>
          <p className="text-[12px] text-white/35">{t("riskNote")}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[13px] font-bold uppercase tracking-wide text-white/85">{title}</h4>
      <ul className="mt-4 flex flex-col gap-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ label, href, onClick }: { label: string; href?: string; onClick?: () => void }) {
  if (onClick) {
    return (
      <li>
        <button onClick={onClick} className="text-[13px] text-white/50 hover:text-[#00E5A0] transition-colors">
          {label}
        </button>
      </li>
    );
  }
  return (
    <li>
      <a href={href} className="text-[13px] text-white/50 hover:text-[#00E5A0] transition-colors">
        {label}
      </a>
    </li>
  );
}
