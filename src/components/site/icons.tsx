"use client";

import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/glob-exchange.jpeg"
      alt="Globexchange Logo"
      className={cn("rounded-xl object-contain bg-white p-0.5 border border-[#00E5A0]/40 shadow-sm shrink-0", className)}
    />
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
