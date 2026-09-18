"use client";

/* Shared password input with an eye toggle — used on login, register,
   admin login, admin client forms, admin profile and the client
   dashboard so EVERY password field in the product can show/hide. */

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
  theme = "dark",
  invalid,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  theme?: "dark" | "light";
  invalid?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className={cn("relative", className)}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-label={ariaLabel}
        dir="ltr"
        className={cn(
          "h-11 w-full rounded-xl border pe-11 text-[1rem] outline-none transition sm:text-sm",
          theme === "dark"
            ? "border-white/10 bg-white/[0.03] px-4 text-white placeholder:text-white/25 focus:border-[#00E5A0]/50 focus:ring-2 focus:ring-[#00E5A0]/15"
            : "rounded-lg border-slate-200 px-3.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15",
          invalid && "border-amber-400/60",
        )}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className={cn(
          "absolute inset-y-0 end-3 flex items-center transition-colors",
          theme === "dark" ? "text-white/30 hover:text-white/60" : "text-slate-400 hover:text-slate-600",
        )}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
