"use client";

import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, right }: { title: string; subtitle: string; right?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {right && <div className="flex items-center gap-3">{right}</div>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]", className)}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tint,
  highlight,
  iconBg,
  icon,
  link,
}: {
  label: string;
  value: string;
  sub: string;
  tint?: boolean;
  highlight?: React.ReactNode;
  iconBg?: string;
  icon?: React.ReactNode;
  link?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05)]",
        tint ? "border-emerald-200/70 bg-emerald-50/60" : "border-slate-200/80 bg-white",
      )}
    >
      {icon && (
        <span
          className={cn(
            "absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full text-white",
            iconBg ?? "bg-emerald-500",
          )}
        >
          {icon}
        </span>
      )}
      <p className="text-[0.9375rem] font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-[1.75rem] font-bold leading-tight tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 text-[0.8125rem] text-slate-500">{sub}</p>
      {highlight && <div className="mt-1 text-[0.8125rem] font-semibold">{highlight}</div>}
      {link && <div className="mt-1 text-[0.8125rem] font-semibold">{link}</div>}
    </div>
  );
}

const badgeStyles: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-600",
  SUSPENDED: "bg-slate-100 text-slate-600",
  PENDING: "bg-amber-50 text-amber-600",
  UNDER_REVIEW: "bg-indigo-50 text-indigo-600",
  APPROVED: "bg-teal-50 text-teal-600",
  PROCESSING: "bg-blue-50 text-blue-600",
  COMPLETED: "bg-emerald-50 text-emerald-600",
  FAILED: "bg-slate-100 text-slate-600",
  REJECTED: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-slate-100 text-slate-500",
};

/** "UNDER_REVIEW" -> "Under Review" */
export function statusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide",
        badgeStyles[status] ?? "bg-slate-100 text-slate-600",
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

export function PrimaryButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function OutlineButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn("relative flex-1", className)}>
      <svg
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
      />
    </div>
  );
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-4 pr-10 text-sm text-slate-700 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15",
          placeholder && value === "" && "text-slate-500",
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
  className,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[0.8125rem] font-medium text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          "h-11 w-full rounded-lg border border-slate-200 px-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15",
          disabled && "cursor-not-allowed bg-slate-100 text-slate-500",
        )}
      />
    </label>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
  panelClassName,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
  panelClassName?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl",
          wide ? "max-w-lg" : "max-w-md",
          panelClassName,
        )}
      >
        <div className="flex shrink-0 items-start justify-between p-6 pb-0">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <XIcon />
          </button>
        </div>
        {/* Internally scrollable body: tall forms (e.g. New Client with Source
            of Funds) stay fully reachable by normal scrolling on every
            viewport — nothing is clipped behind the modal edges. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">{children}</div>
      </div>
    </div>
  );
}

function XIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/** Truncated monospace id like "cmu0wdwt..." */
export function MonoId({ id }: { id: string }) {
  return <span className="font-mono text-[0.8125rem] text-slate-600">{id.length > 11 ? `${id.slice(0, 9)}...` : id}</span>;
}
