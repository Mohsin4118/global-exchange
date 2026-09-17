"use client";

/* ------------------------------------------------------------------ */
/*  CryptoWise — client dashboard parts (DARK NAVY / VERY DARK TEAL)   */
/*  Every figure rendered here comes from the server API — the Super   */
/*  Admin controls all of it from the CRM. Live crypto/stock prices    */
/*  come from the shared market ticker. No red anywhere: negatives     */
/*  use amber. Fully RTL-aware with LTR-wrapped numerics.              */
/* ------------------------------------------------------------------ */

import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Check,
  Crown,
  Lock,
  Pencil,
  Wallet,
  X,
} from "lucide-react";
import { CoinBadge } from "./icons";
import { formatChange, formatPrice, sparkline, sparklinePath, type Coin } from "@/lib/market";
import { ContactButtonsCard } from "./contact-buttons";
import { PasswordInput } from "@/components/ui/password-input";
import type { ClientView, Notification, Tx } from "@/lib/shared-types";
import type { Lang, StringKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type T = (k: StringKey) => string;

export function usd(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtUnits(units: number): string {
  return units.toLocaleString("en-US", { maximumFractionDigits: units >= 1 ? 2 : 4 });
}

export function fmtDate(iso: string, lang: Lang = "en"): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return d.toLocaleDateString(lang === "ar" ? "ar" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export function seedFor(id: string): number {
  let s = 0;
  for (let i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) % 233280;
  return s || 7;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "C";
}

/* ---------------- primitives (dark navy surfaces) ---------------- */

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-white/[0.07] bg-[#071923]/85 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_18px_40px_-24px_rgba(0,0,0,0.9)]", className)}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 sm:px-5 sm:pt-5">
      <h2 className="text-[15px] font-bold tracking-tight text-white">{title}</h2>
      {right}
    </div>
  );
}

export function StatusPill({ status, t }: { status: Tx["status"]; t: T }) {
  const map: Record<string, string> = {
    COMPLETED: "bg-emerald-500/12 text-emerald-300 ring-1 ring-emerald-500/25",
    PENDING: "bg-amber-500/12 text-amber-300 ring-1 ring-amber-500/25",
    PROCESSING: "bg-sky-500/12 text-sky-300 ring-1 ring-sky-500/25",
    REJECTED: "bg-white/[0.06] text-white/50 ring-1 ring-white/10",
  };
  const label = status === "COMPLETED" ? t("statusCompleted") : status === "PENDING" ? t("reqPending") : status === "PROCESSING" ? t("statusProcessing") : t("reqRejected");
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide", map[status])}>{label}</span>;
}

export function LiveChip({ t }: { t: T }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00E5A0]/10 px-2.5 py-1 text-[11px] font-bold text-[#00E5A0] ring-1 ring-[#00E5A0]/25">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00E5A0] opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#00E5A0]" />
      </span>
      {t("live")}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  subTone = "muted",
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  subTone?: "muted" | "up" | "down";
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-white/45 sm:text-[12.5px] sm:normal-case sm:tracking-normal">{label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#00E5A0]/10 text-[#00E5A0] ring-1 ring-[#00E5A0]/20">{icon}</span>
      </div>
      <p className="mt-2.5 font-mono text-[21px] font-bold leading-none tracking-tight text-white sm:text-[24px]" dir="ltr">
        {value}
      </p>
      {sub && (
        <p
          className={cn(
            "mt-2 text-[12px] font-semibold",
            subTone === "up" ? "text-emerald-400" : subTone === "down" ? "text-amber-400" : "text-white/40",
          )}
          dir="ltr"
        >
          {sub}
        </p>
      )}
    </Card>
  );
}

/* ---------------- performance chart (dark style) ---------------- */

export function PerformanceChart({ history, t }: { history: number[]; t: T }) {
  const pts = history.length > 1 ? history : [1, 1];
  const max = Math.max(...pts);
  const min = Math.min(...pts);
  const range = max - min || Math.max(1, max * 0.002);
  const W = 560;
  const H = 190;
  const step = W / (pts.length - 1);
  const coords = pts.map((p, i) => [i * step, H - 26 - ((p - min) / range) * (H - 52)] as const);
  let path = `M${coords[0][0]},${coords[0][1]}`;
  for (let i = 1; i < coords.length; i++) {
    const [x0, y0] = coords[i - 1];
    const [x1, y1] = coords[i];
    const cx = (x0 + x1) / 2;
    path += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  const area = `${path} L${W},${H} L0,${H} Z`;
  const last = coords[coords.length - 1];

  return (
    <Card className="overflow-hidden">
      <SectionTitle title={t("performance")} right={<LiveChip t={t} />} />
      <div className="px-2 pb-3 pt-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full sm:h-44" preserveAspectRatio="none" role="img" aria-label="Portfolio performance chart">
          <defs>
            <linearGradient id="perfFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00E5A0" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#00E5A0" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="0" x2={W} y1={26 + f * (H - 52)} y2={26 + f * (H - 52)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          ))}
          <path d={area} fill="url(#perfFill)" />
          <path d={path} fill="none" stroke="#00E5A0" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx={last[0]} cy={last[1]} r="3.5" fill="#00E5A0" stroke="#04121c" strokeWidth="1.5" />
          <text x={8} y={16} fontSize="11" fill="rgba(255,255,255,0.35)" className="font-mono" direction="ltr">
            {usd(max)}
          </text>
          <text x={8} y={H - 6} fontSize="11" fill="rgba(255,255,255,0.35)" className="font-mono" direction="ltr">
            {usd(min)}
          </text>
        </svg>
      </div>
    </Card>
  );
}

/* ---------------- holdings ---------------- */

export interface HoldingRow {
  units: number;
  coin: Coin;
  value: number;
  sparkPath: string;
}

export function buildHoldingRows(holdings: ClientView["client"]["holdings"], markets: Coin[]): HoldingRow[] {
  return holdings
    .map((h) => {
      const coin = markets.find((m) => m.id === h.assetId);
      if (!coin) return null;
      const base = sparkline(seedFor(coin.id), 24, 1.15);
      const trend = coin.change24h >= 0 ? 7 : -7;
      const series = base.map((v, i) => v + (i / (base.length - 1)) * trend);
      return { units: h.units, coin, value: coin.price * h.units, sparkPath: sparklinePath(series, 72, 28) };
    })
    .filter((r): r is HoldingRow => r !== null)
    .sort((a, b) => b.value - a.value);
}

export function HoldingsTable({ rows, t, lang }: { rows: HoldingRow[]; t: T; lang: Lang }) {
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  if (rows.length === 0) {
    return (
      <Card className="p-10 text-center">
        <p className="text-[15px] font-bold text-white">{t("noAssets")}</p>
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-white/50">{t("noAssetsSub")}</p>
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden">
      {/* desktop table (md+) */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-[12px] font-semibold uppercase tracking-wide text-white/35">
              <th className="px-6 py-3.5 text-start font-semibold">{t("holdings")}</th>
              <th className="px-4 py-3.5 text-end font-semibold">{t("units")}</th>
              <th className="px-4 py-3.5 text-end font-semibold">{t("price")}</th>
              <th className="px-4 py-3.5 text-end font-semibold">{t("value")}</th>
              <th className="px-4 py-3.5 text-end font-semibold">{t("change24h")}</th>
              <th className="px-6 py-3.5 text-end font-semibold">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.coin.id} className="border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.02]">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <CoinBadge glyph={r.coin.glyph} gradient={r.coin.gradient} className="h-9 w-9 text-[13px]" />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-white">{r.coin.name}</p>
                      <p className="truncate text-[11.5px] text-white/35" dir="ltr">
                        {r.coin.symbol}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-end font-semibold tabular-nums text-white/80" dir="ltr">
                  {fmtUnits(r.units)}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-end tabular-nums text-white/45" dir="ltr">
                  {formatPrice(r.coin.price)}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-end font-bold tabular-nums text-white" dir="ltr">
                  {usd(r.value)}
                </td>
                <td className="px-4 py-3.5 text-end">
                  <span
                    className={cn("inline-block rounded-md px-2 py-1 text-[12px] font-bold tabular-nums", r.coin.change24h >= 0 ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300")}
                    dir="ltr"
                  >
                    {formatChange(r.coin.change24h)}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-end">
                  <div className="flex items-center justify-end gap-2.5">
                    <svg viewBox="0 0 72 28" className="h-7 w-16" preserveAspectRatio="none" aria-hidden="true">
                      <path d={r.sparkPath} fill="none" stroke={r.coin.change24h >= 0 ? "#00E5A0" : "#fbbf24"} strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    <span className="w-12 text-end font-semibold tabular-nums text-white/45" dir="ltr">
                      {((r.value / total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* mobile stacked cards (<md) — never scrolls horizontally */}
      <ul className="divide-y divide-white/[0.05] md:hidden">
        {rows.map((r) => (
          <li key={r.coin.id} className="p-4">
            <div className="flex items-center gap-3">
              <CoinBadge glyph={r.coin.glyph} gradient={r.coin.gradient} className="h-9 w-9 shrink-0 text-[13px]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-bold text-white">{r.coin.name}</p>
                <p className="truncate text-[11px] text-white/35" dir="ltr">
                  {r.coin.symbol} · {fmtUnits(r.units)} {t("units").toLowerCase()}
                </p>
              </div>
              <div className="shrink-0 text-end">
                <p className="whitespace-nowrap text-[13.5px] font-bold tabular-nums text-white" dir="ltr">
                  {usd(r.value)}
                </p>
                <p className={cn("text-[11.5px] font-bold tabular-nums", r.coin.change24h >= 0 ? "text-emerald-400" : "text-amber-400")} dir="ltr">
                  {formatChange(r.coin.change24h)}
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-white/[0.05] pt-2.5">
              <span className="text-[11px] text-white/35" dir="ltr">
                {t("price")}: {formatPrice(r.coin.price)}
              </span>
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 72 28" className="h-6 w-14" preserveAspectRatio="none" aria-hidden="true">
                  <path d={r.sparkPath} fill="none" stroke={r.coin.change24h >= 0 ? "#00E5A0" : "#fbbf24"} strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <span className="text-[11px] font-semibold tabular-nums text-white/45" dir="ltr">
                  {((r.value / total) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {lang === "ar" && <span className="hidden">{t("allocation")}</span>}
    </Card>
  );
}

export function AllocationBar({ segments, t }: { segments: Array<{ label: string; value: number; color: string }>; t: T }) {
  const sum = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-[15px] font-bold tracking-tight text-white">{t("allocation")}</p>
      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-white/[0.06]" role="img" aria-label={t("allocation")}>
        {segments.map((s, i) => (
          <div key={i} style={{ width: `${(s.value / sum) * 100}%`, backgroundColor: s.color }} />
        ))}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-[12.5px] font-medium text-white/60">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
            <span className="font-bold tabular-nums text-white" dir="ltr">
              {((s.value / sum) * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ---------------- transactions ---------------- */

export function TxRowItem({ tx, t, lang }: { tx: Tx; t: T; lang: Lang }) {
  const credit = tx.type === "CREDIT";
  return (
    <li className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02] sm:px-5">
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", credit ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20" : "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20")}>
        {credit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold text-white">
          {tx.labelKey ? t(tx.labelKey as StringKey) : tx.label}
          {tx.asset ? <span className="font-normal text-white/45"> · {tx.asset}</span> : null}
        </p>
        <p className="mt-0.5 text-[11.5px] text-white/35" dir="ltr">
          {fmtDate(tx.dateISO, lang)} · {tx.method}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={cn("whitespace-nowrap text-[13.5px] font-bold tabular-nums", credit ? "text-emerald-400" : "text-amber-400")} dir="ltr">
          {credit ? "+" : "−"}
          {usd(tx.amount)}
        </span>
        <StatusPill status={tx.status} t={t} />
      </div>
    </li>
  );
}

/* ---------------- request modal (deposit / withdrawal, dark) ---------------- */

export function RequestModal({
  kind,
  t,
  available,
  onClose,
  onSubmit,
}: {
  kind: "deposit" | "withdrawal";
  t: T;
  available: number;
  onClose: () => void;
  onSubmit: (amount: number, note: string) => Promise<string | null>; // returns error key or null
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError(t("requestInvalid"));
      return;
    }
    if (kind === "withdrawal" && value > available) {
      setError(t("requestTooMuch"));
      return;
    }
    setBusy(true);
    const err = await onSubmit(value, note.trim());
    setBusy(false);
    if (err) setError(t(err as StringKey));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#020b12]/70 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#071923] shadow-2xl">
        <div className="flex items-center justify-between p-5 pb-0">
          <h3 className="text-lg font-bold text-white">{kind === "deposit" ? t("requestTitleDeposit") : t("requestTitleWithdraw")}</h3>
          <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <p className="rounded-lg bg-white/[0.04] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-white/50">{t("requestHint")}</p>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-white/60">{t("requestAmount")}</span>
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              dir="ltr"
              aria-label={t("requestAmount")}
              className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3.5 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#00E5A0]/50 focus:ring-2 focus:ring-[#00E5A0]/15"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-white/60">{t("requestNote")}</span>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full resize-y rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#00E5A0]/50 focus:ring-2 focus:ring-[#00E5A0]/15"
            />
          </label>
          {error && <p className="rounded-lg bg-amber-500/10 px-3.5 py-2 text-[12.5px] font-semibold text-amber-300 ring-1 ring-amber-500/20">{error}</p>}
          <div className="flex justify-end gap-2.5 pt-1">
            <button onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/[0.05]">
              {t("cancel")}
            </button>
            <button
              onClick={submit}
              disabled={busy}
              className="rounded-lg bg-[#00E5A0] px-4 py-2.5 text-sm font-bold text-[#022c20] transition-colors hover:bg-[#2cf0b5] disabled:opacity-50"
            >
              {t("requestSubmit")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- notifications ---------------- */

export function NotificationsCard({
  notifications,
  t,
  onMarkAll,
  limit,
}: {
  notifications: Notification[];
  t: T;
  onMarkAll: () => void;
  limit?: number;
}) {
  const unread = notifications.filter((n) => n.unread).length;
  const list = limit ? notifications.slice(0, limit) : notifications;
  return (
    <Card className="overflow-hidden">
      <SectionTitle
        title={t("notificationsTitle")}
        right={
          unread > 0 ? (
            <button onClick={onMarkAll} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[12px] font-semibold text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white">
              <Check className="h-3.5 w-3.5" /> {t("markAllRead")}
            </button>
          ) : undefined
        }
      />
      <ul className="mt-3 max-h-80 space-y-0 overflow-y-auto">
        {list.map((n) => (
          <li key={n.id} className={cn("flex items-start gap-3 border-b border-white/[0.05] px-4 py-3.5 last:border-0 sm:px-5", n.unread && "bg-[#00E5A0]/[0.05]")}>
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
              <Bell className="h-3.5 w-3.5 text-white/50" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[13px] font-bold text-white">{n.title}</p>
                {n.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#00E5A0]" />}
              </div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-white/45">{n.body}</p>
            </div>
            <span className="shrink-0 text-[11px] text-white/30">{n.time}</span>
          </li>
        ))}
        {list.length === 0 && <li className="px-6 py-8 text-center text-[13px] text-white/45">{t("noNotifications")}</li>}
      </ul>
    </Card>
  );
}

/* ---------------- profile & account ---------------- */

export function ProfileCard({
  view,
  t,
  onProfileSave,
  onPasswordSave,
  lang,
}: {
  view: ClientView;
  t: T;
  onProfileSave: (patch: { phone: string; country: string; address: string; city: string; postcode: string }) => Promise<string | null>;
  onPasswordSave: (current: string, next: string) => Promise<string | null>;
  lang: Lang;
}) {
  const c = view.client;
  const fin = view.financials;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ phone: c.phone, country: c.country, address: c.address, city: c.city, postcode: c.postcode });
  const [busy, setBusy] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    const err = await onProfileSave(form);
    setBusy(false);
    if (!err) setEditing(false);
  };

  const changePassword = async () => {
    if (pw.next !== pw.confirm) {
      setPwError(t("passwordsMismatch"));
      return;
    }
    setBusy(true);
    const err = await onPasswordSave(pw.current, pw.next);
    setBusy(false);
    if (err) {
      setPwError(t(err as StringKey));
      return;
    }
    setPwOpen(false);
    setPw({ current: "", next: "", confirm: "" });
    setPwError(null);
  };

  const rows: Array<[string, string, boolean?]> = [
    [t("emailAddress"), c.email, true],
    [t("phone"), c.phone || "—", true],
    [t("address"), [c.address, c.city, c.postcode].filter(Boolean).join(", ") || "—"],
    [t("country"), c.country || "—"],
    [t("accountNo"), c.accountNo, true],
    [t("openingBalance"), usd(c.openingBalance), true],
    [t("creditsLabel"), usd(fin.credits), true],
    [t("debitsLabel"), usd(fin.debits), true],
    [t("statusLabel"), c.status === "active" ? t("active") : t("suspended")],
    [t("tierLabel"), c.tier === "Private" ? t("tierPrivate") : c.tier === "Premium" ? t("tierPremium") : t("tierStandard")],
  ];

  const inputCls =
    "h-11 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3.5 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#00E5A0]/50 focus:ring-2 focus:ring-[#00E5A0]/15";

  return (
    <Card className="overflow-hidden">
      <SectionTitle
        title={t("profileTitle")}
        right={
          !editing ? (
            <button
              onClick={() => {
                setForm({ phone: c.phone, country: c.country, address: c.address, city: c.city, postcode: c.postcode });
                setEditing(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[12px] font-semibold text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              <Pencil className="h-3.5 w-3.5" /> {t("editProfile")}
            </button>
          ) : undefined
        }
      />
      <div className="px-4 pb-5 pt-3 sm:px-5">
        {editing ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-white/60">{t("phone")}</span>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-white/60">{t("country")}</span>
              <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputCls} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-medium text-white/60">{t("address")}</span>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-white/60">{t("city")}</span>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-white/60">{t("postcode")}</span>
              <input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} className={inputCls} />
            </label>
            <div className="flex justify-end gap-2.5 sm:col-span-2">
              <button onClick={() => setEditing(false)} className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/[0.05]">
                {t("cancel")}
              </button>
              <button onClick={save} disabled={busy} className="rounded-lg bg-[#00E5A0] px-4 py-2.5 text-sm font-bold text-[#022c20] transition-colors hover:bg-[#2cf0b5] disabled:opacity-50">
                {t("saveProfile")}
              </button>
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            {rows.map(([k, v, ltr]) => (
              <div key={k} className="flex items-center justify-between gap-4 border-b border-white/[0.05] py-2.5 last:border-0">
                <dt className="shrink-0 text-[12.5px] font-medium text-white/40">{k}</dt>
                <dd className="truncate text-[13px] font-semibold text-white" dir={ltr || /^[+$\d]/.test(v) ? "ltr" : undefined}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-5 border-t border-white/[0.06] pt-4">
          {!pwOpen ? (
            <button onClick={() => setPwOpen(true)} className="text-[13px] font-bold text-[#00E5A0] transition-colors hover:text-[#2cf0b5]">
              {t("changePassword")}
            </button>
          ) : (
            <div className="max-w-sm space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-white/60">{t("currentPassword")}</span>
                <PasswordInput theme="dark" value={pw.current} onChange={(v) => setPw({ ...pw, current: v })} autoComplete="current-password" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-white/60">{t("newPassword")}</span>
                <PasswordInput theme="dark" value={pw.next} onChange={(v) => setPw({ ...pw, next: v })} autoComplete="new-password" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-white/60">{t("confirmNewPassword")}</span>
                <PasswordInput theme="dark" value={pw.confirm} onChange={(v) => setPw({ ...pw, confirm: v })} autoComplete="new-password" />
              </label>
              {pwError && <p className="rounded-lg bg-amber-500/10 px-3.5 py-2 text-[12.5px] font-semibold text-amber-300 ring-1 ring-amber-500/20">{pwError}</p>}
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => {
                    setPwOpen(false);
                    setPwError(null);
                  }}
                  className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/[0.05]"
                >
                  {t("cancel")}
                </button>
                <button onClick={changePassword} disabled={busy} className="rounded-lg bg-[#00E5A0] px-4 py-2.5 text-sm font-bold text-[#022c20] transition-colors hover:bg-[#2cf0b5] disabled:opacity-50">
                  {t("changePassword")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {lang === "ar" && <span className="hidden">{c.name}</span>}
    </Card>
  );
}

/* ---------------- contact ---------------- */

export function ContactCard({ t }: { t: T }) {
  return (
    <Card className="overflow-hidden">
      <SectionTitle title={t("contactTitle")} />
      <div className="px-4 pb-5 pt-3 sm:px-5">
        <p className="mb-3.5 text-[12.5px] text-white/45">{t("contactSub")}</p>
        <ContactButtonsCard variant="dark" />
      </div>
    </Card>
  );
}

/* ---------------- market overview ---------------- */

export function MarketStrip({ coins, stocks, t }: { coins: Coin[]; stocks: Coin[]; t: T }) {
  const top = [...coins, ...stocks].slice(0, 6);
  return (
    <Card className="overflow-hidden">
      <SectionTitle title={t("marketOverview")} right={<LiveChip t={t} />} />
      <div className="grid grid-cols-1 gap-2.5 p-4 sm:grid-cols-2 sm:p-5">
        {top.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <CoinBadge glyph={c.glyph} gradient={c.gradient} className="h-8 w-8 text-[12px]" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-white">{c.name}</p>
                <p className="truncate text-[11px] text-white/35" dir="ltr">
                  {c.symbol}
                  {c.exchange ? ` · ${c.exchange}` : ""}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-end">
              <p className="whitespace-nowrap text-[13px] font-bold tabular-nums text-white" dir="ltr">
                {formatPrice(c.price)}
              </p>
              <p className={cn("text-[11px] font-bold tabular-nums", c.change24h >= 0 ? "text-emerald-400" : "text-amber-400")} dir="ltr">
                {formatChange(c.change24h)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------------- badges ---------------- */

export function TierBadge({ tier, t }: { tier: string; t: T }) {
  if (tier === "Private") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-2.5 py-1 text-[11.5px] font-bold text-amber-300 ring-1 ring-amber-400/25">
        <Crown className="h-3.5 w-3.5" /> {t("tierPrivate")}
      </span>
    );
  }
  if (tier === "Premium") {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00E5A0]/10 px-2.5 py-1 text-[11.5px] font-bold text-[#00E5A0] ring-1 ring-[#00E5A0]/25">{t("tierPremium")}</span>;
  }
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] font-bold text-white/60 ring-1 ring-white/10">{t("tierStandard")}</span>;
}

/** Green Verified badge with a check icon — rendered NEXT TO the client name. */
export function VerifiedBadge({ verified, t }: { verified: boolean; t: T }) {
  if (!verified) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-2.5 py-1 text-[11.5px] font-bold text-amber-300 ring-1 ring-amber-400/25">
        <BadgeCheck className="h-3.5 w-3.5" /> {t("kycPendingBadge")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11.5px] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
      <BadgeCheck className="h-3.5 w-3.5" /> {t("verifiedBadge")}
    </span>
  );
}

/** "Private" privacy badge — rendered UNDER the client name. */
export function PrivateBadge({ t }: { t: T }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-2.5 py-1 text-[11.5px] font-bold text-white/70 ring-1 ring-white/15">
      <Lock className="h-3 w-3" /> {t("privateBadge")}
    </span>
  );
}

export function WalletGlyph() {
  return <Wallet className="h-4 w-4" />;
}
