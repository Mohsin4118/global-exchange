"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { BadgeCheck, Lock, KeyRound, Snowflake, FileCheck2, Vault, Star, ChevronDown, Sprout } from "lucide-react";
import type { StringKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ---------------- Animated trust stats bar ---------------- */

function Counter({ target, suffix, decimals = 0 }: { target: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1600;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);

  const formatted =
    decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString("en-US");

  return (
    <span ref={ref} className="font-mono tabular-nums" dir="ltr">
      {formatted}
      {suffix}
    </span>
  );
}

export function TrustStats({ t }: { t: (k: StringKey) => string }) {
  const stats = [
    { target: 3, suffix: "M+", label: t("statsUsers") },
    { target: 120, suffix: "B+", label: t("statsVolume"), prefix: "$" },
    { target: 99.9, suffix: "%", label: t("statsUptime"), decimals: 1 },
  ];
  return (
    <section className="relative border-b border-white/[0.04]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55 }}
          className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8 rounded-2xl border border-[#00E5A0]/15 bg-gradient-to-r from-[#00E5A0]/[0.07] via-white/[0.02] to-[#00E5A0]/[0.05] px-6 py-6 md:px-8"
        >
          {/* brand trust copy */}
          <div className="flex items-center gap-4 lg:max-w-[380px]">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#00E5A0]/15 text-[#00E5A0]">
              <Sprout className="h-5.5 w-5.5" />
            </span>
            <div>
              <p className="text-[0.9375rem] font-bold text-[#00E5A0]">{t("trustedBy")}</p>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-white/55">{t("trustedByDesc")}</p>
            </div>
          </div>

          {/* animated stats */}
          <div className="flex flex-1 flex-col sm:flex-row items-center gap-5 sm:gap-0 sm:justify-around lg:ps-6">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={
                  "text-center px-6 sm:px-8" +
                  (i > 0 ? " sm:border-s sm:border-white/[0.08]" : "")
                }
              >
                <p className="text-2xl sm:text-[1.625rem] font-bold text-white">
                  {s.prefix}
                  <Counter target={s.target} suffix={s.suffix} decimals={s.decimals} />
                </p>
                <p className="mt-1 text-[0.75rem] font-medium text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- Security certification badges ---------------- */

export function SecurityBadges({ t }: { t: (k: StringKey) => string }) {
  const badges = [
    { icon: BadgeCheck, title: t("badgeFca"), desc: t("badgeFcaDesc") },
    { icon: Lock, title: t("badgeSsl"), desc: t("badgeSslDesc") },
    { icon: KeyRound, title: t("badge2fa"), desc: t("badge2faDesc") },
    { icon: Snowflake, title: t("badgeCold"), desc: t("badgeColdDesc") },
    { icon: FileCheck2, title: t("badgeReserves"), desc: t("badgeReservesDesc") },
    { icon: Vault, title: t("badgeSegregated"), desc: t("badgeSegregatedDesc") },
  ];
  return (
    <section className="border-y border-white/[0.05] bg-[#020b12]/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
          className="text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{t("badgesTitle")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-[0.90625rem] leading-relaxed text-white/55">{t("badgesSub")}</p>
        </motion.div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {badges.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="group flex flex-col items-center rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center hover:border-[#00E5A0]/30 hover:bg-[#00e5a014] transition-colors"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#00E5A0]/30 bg-[#00E5A0]/10 text-[#00E5A0] group-hover:scale-110 transition-transform">
                <b.icon className="h-4.5 w-4.5" />
              </span>
              <p className="mt-3 text-[0.78125rem] font-bold text-white leading-tight">{b.title}</p>
              <p className="mt-1 text-[0.65625rem] leading-snug text-white/40">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Testimonials ---------------- */

function Stars() {
  return (
    <div className="flex gap-0.5" aria-label="5 out of 5 stars" dir="ltr">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

export function Testimonials({ t }: { t: (k: StringKey) => string }) {
  const items = [
    { quote: t("t1"), name: t("t1Name"), loc: t("t1Loc"), initial: "A" },
    { quote: t("t2"), name: t("t2Name"), loc: t("t2Loc"), initial: "S" },
    { quote: t("t3"), name: t("t3Name"), loc: t("t3Loc"), initial: "J" },
    { quote: t("t4"), name: t("t4Name"), loc: t("t4Loc"), initial: "L" },
    { quote: t("t5"), name: t("t5Name"), loc: t("t5Loc"), initial: "Y" },
    { quote: t("t6"), name: t("t6Name"), loc: t("t6Loc"), initial: "E" },
  ];
  return (
    <section>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
          className="text-center"
        >
          <span className="text-[0.78125rem] font-semibold uppercase tracking-[0.18em] text-[#00E5A0]">
            {t("testimonialsBadge")}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">{t("testimonialsTitle")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-white/55">{t("testimonialsSub")}</p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <motion.figure
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 hover:border-[#00E5A0]/25 transition-colors"
            >
              <Stars />
              <blockquote className="mt-3.5 flex-1 text-[0.84375rem] leading-relaxed text-white/70">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#00E5A0]/80 to-teal-600 text-[0.8125rem] font-bold text-[#03251b]">
                  {item.initial}
                </span>
                <div>
                  <p className="text-[0.8125rem] font-semibold text-white">{item.name}</p>
                  <p className="text-[0.6875rem] text-white/40">{item.loc}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */

export function Faq({ t }: { t: (k: StringKey) => string }) {
  const faqs = [
    { q: t("faq1q"), a: t("faq1a") },
    { q: t("faq2q"), a: t("faq2a") },
    { q: t("faq3q"), a: t("faq3a") },
    { q: t("faq4q"), a: t("faq4a") },
    { q: t("faq5q"), a: t("faq5a") },
  ];
  const [open, setOpen] = useState<number>(0);

  return (
    <section className="border-t border-white/[0.05] bg-[#020b12]/70">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
          className="text-center"
        >
          <span className="text-[0.78125rem] font-semibold uppercase tracking-[0.18em] text-[#00E5A0]">{t("faqBadge")}</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">{t("faqTitle")}</h2>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-white/55">{t("faqSub")}</p>
        </motion.div>

        <div className="mt-10 flex flex-col gap-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className={cn(
                  "rounded-xl border transition-colors",
                  isOpen ? "border-[#00E5A0]/30 bg-[#00e5a014]" : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14]"
                )}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
                >
                  <span className="text-[0.90625rem] font-semibold text-white">{f.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-[#00E5A0] transition-transform duration-300",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-out",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-[0.84375rem] leading-relaxed text-white/55">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
