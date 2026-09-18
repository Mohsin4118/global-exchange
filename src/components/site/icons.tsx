"use client";

import { cn } from "@/lib/utils";

/** Original mountain-arrows exchange mark (drawn from scratch). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#00E5A0" fillOpacity="0.12" />
      <rect x="0.75" y="0.75" width="38.5" height="38.5" rx="10.25" stroke="#00E5A0" strokeOpacity="0.35" strokeWidth="1.5" />
      <path d="M9 26.5 16 14l4.4 7.6L24 16l7 10.5" stroke="#00E5A0" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24.5" cy="12.5" r="2.4" fill="#00E5A0" />
    </svg>
  );
}

export function Logo({
  lang,
  tagline,
  onClick,
  tone = "dark",
}: {
  lang: "en" | "ar";
  tagline: string;
  onClick?: () => void;
  /** background tone the logo sits on — "light" renders slate text for white surfaces */
  tone?: "dark" | "light";
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 group outline-none focus-visible:ring-2 focus-visible:ring-[#00E5A0]/60 rounded-xl"
      aria-label="CryptoWise — home"
    >
      <LogoMark className="w-10 h-10 shrink-0 transition-transform duration-300 group-hover:scale-105" />
      <span className="flex flex-col items-start leading-tight">
        <span
          className={cn(
            "font-semibold tracking-tight text-[1.0625rem]",
            tone === "light" ? "text-slate-900" : "text-white",
            lang === "ar" && "text-base"
          )}
        >
          {lang === "ar" ? "كريبتو وايز" : "CryptoWise"}
        </span>
        <span
          className={cn(
            "text-[0.625rem] tracking-[0.22em] font-medium uppercase",
            tone === "light" ? "text-emerald-600" : "text-[#00E5A0]/80"
          )}
        >
          {tagline}
        </span>
      </span>
    </button>
  );
}

/** Circular coin badge drawn with CSS gradients + glyph. */
export function CoinBadge({
  glyph,
  gradient,
  className,
}: {
  glyph: string;
  gradient: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-gradient-to-br text-black/80 font-bold shadow-inner shrink-0",
        gradient,
        className
      )}
      aria-hidden="true"
    >
      {glyph}
    </span>
  );
}
