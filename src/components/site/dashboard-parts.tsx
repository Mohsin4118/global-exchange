"use client";

/* ------------------------------------------------------------------ */
/*  CryptoWise — client dashboard parts (WHITE / LIGHT banking)   */
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
import { formatChange, sparkline, sparklinePath, type Coin } from "@/lib/market";
import { ContactButtonsCard } from "./contact-buttons";
import { PasswordInput } from "@/components/ui/password-input";
import { CURRENCIES } from "@/lib/shared-types";
import type { ClientView, CurrencyCode, Notification, Tx } from "@/lib/shared-types";
import type { Lang, StringKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type T = (k: StringKey) => string;

export function usd(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ---------------- display-currency formatting ---------------- */
/*  ONE formatter for every money figure on the dashboard. The ledger
    is USD; `fmtMoney` applies the admin-managed reference rate from
    the DB so the whole dashboard stays consistent when the account
    display currency changes. No rates are hardcoded in components. */
export type Fx = Record<string, number>;

export const CURRENCY_META: Record<string, { label: string; symbol?: string }> = {
  USD: { label: "US Dollar", symbol: "$" },
  SAR: { label: "Saudi Riyal" },
  KWD: { label: "Kuwaiti Dinar" },
  AED: { label: "UAE Dirham" },
  QAR: { label: "Qatari Riyal" },
  OMR: { label: "Omani Rial" },
  GBP: { label: "British Pound", symbol: "£" },
};

export function fmtMoney(n: number, code = "USD", fx: Fx = { USD: 1 }): string {
  const rate = code === "USD" ? 1 : fx[code] || 1;
  const value = n * rate;
  const abs = Math.abs(value);
  // small converted figures keep more decimals so prices never collapse
  const decimals = abs > 0 && abs < 1 ? 4 : abs < 100 ? 2 : 2;
  const body = value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const meta = CURRENCY_META[code];
  if (meta?.symbol && code === "USD") return `$${body}`;
  if (meta?.symbol) return `${meta.symbol}${body}`;
  return `${code} ${body}`;
}

/** A currency formatter bound to one display currency — passed down as `money`. */
export function makeMoney(code: string, fx: Fx): (n: number) => string {
  return (n: number) => fmtMoney(n, code, fx);
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

/* ---------------- primitives (light banking surfaces) ---------------- */

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-28px_rgba(15,23,42,0.35)]", className)}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 sm:px-5 sm:pt-5">
      <h2 className="text-[15px] font-bold tracking-tight text-slate-900">{title}</h2>
      {right}
    </div>
  );
}

export function StatusPill({ status, t }: { status: Tx["status"]; t: T }) {
  const map: Record<string, string> = {
    COMPLETED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    PENDING: "bg-amber-50 text-amber-800 ring-1 ring-amber-600/20",
    UNDER_REVIEW: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20",
    APPROVED: "bg-teal-50 text-teal-700 ring-1 ring-teal-600/20",
    PROCESSING: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20",
    REJECTED: "bg-slate-100 text-slate-500 ring-1 ring-white/10",
    CANCELLED: "bg-slate-100 text-slate-500 ring-1 ring-white/10",
  };
  const labels: Record<string, string> = {
    COMPLETED: t("statusCompleted"),
    PENDING: t("reqPending"),
    UNDER_REVIEW: t("statusUnderReview"),
    APPROVED: t("statusApproved"),
    PROCESSING: t("statusProcessing"),
    REJECTED: t("reqRejected"),
    CANCELLED: t("statusCancelled"),
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide", map[status] ?? "bg-slate-100 text-slate-500")}>{labels[status] ?? status}</span>;
}

export function LiveChip({ t }: { t: T }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 ring-1 ring-emerald-600/20">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600" />
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
        <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500 sm:text-[12.5px] sm:normal-case sm:tracking-normal">{label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/15">{icon}</span>
      </div>
      <p className="mt-2.5 font-mono text-[21px] font-bold leading-none tracking-tight text-slate-900 sm:text-[24px]" dir="ltr">
        {value}
      </p>
      {sub && (
        <p
          className={cn(
            "mt-2 text-[12px] font-semibold",
            subTone === "up" ? "text-emerald-600" : subTone === "down" ? "text-amber-600" : "text-slate-500",
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

export function PerformanceChart({ history, t, money = usd }: { history: number[]; t: T; money?: (n: number) => string }) {
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
              <stop offset="0%" stopColor="#059669" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="0" x2={W} y1={26 + f * (H - 52)} y2={26 + f * (H - 52)} stroke="rgba(15,23,42,0.07)" strokeWidth="1" />
          ))}
          <path d={area} fill="url(#perfFill)" />
          <path d={path} fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx={last[0]} cy={last[1]} r="3.5" fill="#059669" stroke="#ffffff" strokeWidth="1.5" />
          <text x={8} y={16} fontSize="11" fill="rgba(100,116,139,0.9)" className="font-mono" direction="ltr">
            {money(max)}
          </text>
          <text x={8} y={H - 6} fontSize="11" fill="rgba(100,116,139,0.9)" className="font-mono" direction="ltr">
            {money(min)}
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

export function HoldingsTable({ rows, t, lang, money = usd }: { rows: HoldingRow[]; t: T; lang: Lang; money?: (n: number) => string }) {
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  if (rows.length === 0) {
    return (
      <Card className="p-10 text-center">
        <p className="text-[15px] font-bold text-slate-900">{t("noAssets")}</p>
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-slate-500">{t("noAssetsSub")}</p>
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden">
      {/* desktop table (lg+) — wrapped in its own horizontal scroller so it
          can never crop columns or push the page wider than the viewport */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200/70 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3.5 text-start font-semibold">{t("holdings")}</th>
              <th className="px-3 py-3.5 text-end font-semibold">{t("units")}</th>
              <th className="px-3 py-3.5 text-end font-semibold">{t("price")}</th>
              <th className="px-3 py-3.5 text-end font-semibold">{t("value")}</th>
              <th className="px-3 py-3.5 text-end font-semibold">{t("change24h")}</th>
              <th className="px-5 py-3.5 text-end font-semibold">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.coin.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <CoinBadge glyph={r.coin.glyph} gradient={r.coin.gradient} className="h-9 w-9 text-[13px]" />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900">{r.coin.name}</p>
                      <p className="truncate text-[11.5px] text-slate-400" dir="ltr">
                        {r.coin.symbol}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-end font-semibold tabular-nums text-slate-500" dir="ltr">
                  {fmtUnits(r.units)}
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-end tabular-nums text-slate-500" dir="ltr">
                  {money(r.coin.price)}
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-end font-bold tabular-nums text-slate-900" dir="ltr">
                  {money(r.value)}
                </td>
                <td className="px-3 py-3.5 text-end">
                  <span
                    className={cn("inline-block rounded-md px-2 py-1 text-[12px] font-bold tabular-nums", r.coin.change24h >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800")}
                    dir="ltr"
                  >
                    {formatChange(r.coin.change24h)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-end">
                  <div className="flex items-center justify-end gap-2.5">
                    <svg viewBox="0 0 72 28" className="h-7 w-16" preserveAspectRatio="none" aria-hidden="true">
                      <path d={r.sparkPath} fill="none" stroke={r.coin.change24h >= 0 ? "#059669" : "#fbbf24"} strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    <span className="w-12 text-end font-semibold tabular-nums text-slate-500" dir="ltr">
                      {((r.value / total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* stacked cards (<lg) — never scrolls horizontally */}
      <ul className="divide-y divide-slate-100 lg:hidden">
        {rows.map((r) => (
          <li key={r.coin.id} className="p-4">
            <div className="flex items-center gap-3">
              <CoinBadge glyph={r.coin.glyph} gradient={r.coin.gradient} className="h-9 w-9 shrink-0 text-[13px]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-bold text-slate-900">{r.coin.name}</p>
                <p className="truncate text-[11px] text-slate-400" dir="ltr">
                  {r.coin.symbol} · {fmtUnits(r.units)} {t("units").toLowerCase()}
                </p>
              </div>
              <div className="shrink-0 text-end">
                <p className="whitespace-nowrap text-[13.5px] font-bold tabular-nums text-slate-900" dir="ltr">
                  {money(r.value)}
                </p>
                <p className={cn("text-[11.5px] font-bold tabular-nums", r.coin.change24h >= 0 ? "text-emerald-600" : "text-amber-600")} dir="ltr">
                  {formatChange(r.coin.change24h)}
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-slate-100 pt-2.5">
              <span className="text-[11px] text-slate-400" dir="ltr">
                {t("price")}: {money(r.coin.price)}
              </span>
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 72 28" className="h-6 w-14" preserveAspectRatio="none" aria-hidden="true">
                  <path d={r.sparkPath} fill="none" stroke={r.coin.change24h >= 0 ? "#059669" : "#fbbf24"} strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <span className="text-[11px] font-semibold tabular-nums text-slate-500" dir="ltr">
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
      <p className="text-[15px] font-bold tracking-tight text-slate-900">{t("allocation")}</p>
      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-slate-100" role="img" aria-label={t("allocation")}>
        {segments.map((s, i) => (
          <div key={i} style={{ width: `${(s.value / sum) * 100}%`, backgroundColor: s.color }} />
        ))}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-[12.5px] font-medium text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
            <span className="font-bold tabular-nums text-slate-900" dir="ltr">
              {((s.value / sum) * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ---------------- transactions ---------------- */

export function TxRowItem({ tx, t, lang, onCancel, money = usd }: { tx: Tx; t: T; lang: Lang; onCancel?: (tx: Tx) => void; money?: (n: number) => string }) {
  const credit = tx.type === "CREDIT";
  const [open, setOpen] = useState(false);
  const history = [...(tx.history ?? [])].reverse();
  const isRequest = tx.status !== "COMPLETED" || (tx.kind !== "adjustment" && tx.kind !== "opening");
  return (
    <li className="transition-colors hover:bg-slate-50/60">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3.5 text-start sm:px-5">
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", credit ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15" : "bg-amber-50 text-amber-800 ring-1 ring-amber-600/15")}>
          {credit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold text-slate-900">
            {tx.labelKey ? t(tx.labelKey as StringKey) : tx.label}
            {tx.asset ? <span className="font-normal text-slate-500"> · {tx.asset}</span> : null}
          </p>
          <p className="mt-0.5 text-[11.5px] text-slate-400" dir="ltr">
            {fmtDate(tx.dateISO, lang)} · {tx.method} · {tx.reference}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={cn("whitespace-nowrap text-[13.5px] font-bold tabular-nums", credit ? "text-emerald-600" : "text-amber-600")} dir="ltr">
            {credit ? "+" : "−"}
            {money(tx.amount)}
          </span>
          <StatusPill status={tx.status} t={t} />
        </div>
        <ChevronDownIcon open={open} />
      </button>

      {open && (
        <div className="mx-4 mb-4 space-y-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:mx-5 sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Detail label={t("requestRef")} value={tx.reference} mono />
            <Detail label={t("requestType")} value={tx.kind} />
            {tx.asset && <Detail label={t("requestAsset")} value={tx.asset} />}
            {tx.destination && <Detail label={t("requestDestination")} value={tx.destination} />}
            <Detail label={t("requestNote")} value={tx.notes} />
            <Detail label={t("requestAmount")} value={money(tx.amount)} mono />
          </div>

          {history.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">{t("statusHistory")}</p>
              <ol className="space-y-2.5 border-s border-slate-200 ps-4">
                {history.map((ev, i) => (
                  <li key={`${ev.at}-${i}`} className="text-[12px] leading-relaxed">
                    <p className="font-semibold text-slate-700">
                      {ev.from ? `${ev.byRole === "client" && ev.from === ev.to ? t("requestDetails") : statusLabelFor(ev.from, t)} → ${statusLabelFor(ev.to, t)}` : t("txSubmitted")}
                      <span className="ms-2 font-normal text-slate-400" dir="ltr">
                        {new Date(ev.at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </p>
                    <p className="text-slate-400">{ev.byRole === "client" ? ev.by : "Super Admin"}</p>
                    {ev.note && <p className="mt-0.5 rounded-md bg-white px-2.5 py-1.5 text-slate-600 ring-1 ring-slate-200/70">{ev.note}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {isRequest && tx.status === "PENDING" && onCancel && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onCancel(tx)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[12.5px] font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" /> {t("cancelRequest")}
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg className={cn("h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform", open && "rotate-180")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function statusLabelFor(status: Tx["status"] | null | undefined, t: T): string {
  if (!status) return t("txSubmitted");
  const labels: Record<string, string> = {
    COMPLETED: t("statusCompleted"),
    PENDING: t("reqPending"),
    UNDER_REVIEW: t("statusUnderReview"),
    APPROVED: t("statusApproved"),
    PROCESSING: t("statusProcessing"),
    REJECTED: t("reqRejected"),
    CANCELLED: t("statusCancelled"),
  };
  return labels[status] ?? status;
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={cn("mt-0.5 break-words text-[12.5px] font-semibold text-slate-700", mono && "font-mono")} dir={mono ? "ltr" : undefined}>
        {value}
      </p>
    </div>
  );
}

/* ---------------- transaction request modal (#27) ----------------
   The client can ONLY submit a REQUEST — type, amount, asset,
   destination/details and an optional note. The server assigns the
   reference and the PENDING status; nothing is ever auto-executed. */

export const REQUEST_KINDS = ["deposit", "withdrawal", "trade"] as const;
export type RequestKind = (typeof REQUEST_KINDS)[number];

const ASSET_OPTIONS = ["USD", "USDT", "BTC", "ETH", "SOL", "XRP", "Aramco", "Salik"];

export function RequestModal({
  initialKind,
  t,
  available,
  onClose,
  onSubmit,
}: {
  initialKind: RequestKind;
  t: T;
  available: number;
  onClose: () => void;
  onSubmit: (payload: { kind: RequestKind; amount: number; asset: string; destination: string; note: string }) => Promise<string | null>; // returns error key or null
}) {
  const [kind, setKind] = useState<RequestKind>(initialKind);
  const [amount, setAmount] = useState("");
  const [asset, setAsset] = useState("USD");
  const [destination, setDestination] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const title = kind === "deposit" ? t("requestTitleDeposit") : kind === "withdrawal" ? t("requestTitleWithdraw") : t("requestTitleTrade");

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
    if (kind === "trade" && !destination.trim()) {
      setError(t("requestDestinationHint"));
      return;
    }
    setBusy(true);
    const err = await onSubmit({ kind, amount: value, asset, destination: destination.trim(), note: note.trim() });
    setBusy(false);
    if (err) setError(t(err as StringKey));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between p-5 pb-0">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <p className="rounded-lg bg-emerald-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-slate-600 ring-1 ring-emerald-600/10">{t("requestHint")}</p>

          {/* request type */}
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-slate-600">{t("requestType")}</span>
            <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">
              {REQUEST_KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={cn(
                    "rounded-lg px-2 py-2 text-[12px] font-bold capitalize transition-colors",
                    kind === k ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-600">{t("requestAmount")}</span>
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                dir="ltr"
                aria-label={t("requestAmount")}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[16px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 sm:text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-600">{t("requestAsset")}</span>
              <select
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                aria-label={t("requestAsset")}
                className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3.5 text-[16px] font-semibold text-slate-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 sm:text-sm"
              >
                {ASSET_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-slate-600">
              {t("requestDestination")}
              {kind === "withdrawal" && <span className="ms-1 text-slate-400">({t("requestDestinationHint")})</span>}
            </span>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={kind === "withdrawal" ? "0x… / IBAN / wallet" : kind === "trade" ? "e.g. Buy BTC with USD" : "Optional reference"}
              dir={kind === "withdrawal" ? "ltr" : undefined}
              aria-label={t("requestDestination")}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[16px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 sm:text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-slate-600">{t("requestNote")}</span>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
            />
          </label>

          {error && <p className="rounded-lg bg-amber-50 px-3.5 py-2 text-[12.5px] font-semibold text-amber-800 ring-1 ring-amber-600/15">{error}</p>}
          <div className="flex justify-end gap-2.5 pt-1">
            <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100">
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
            <button onClick={onMarkAll} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
              <Check className="h-3.5 w-3.5" /> {t("markAllRead")}
            </button>
          ) : undefined
        }
      />
      <ul className="mt-3 max-h-80 space-y-0 overflow-y-auto">
        {list.map((n) => (
          <li key={n.id} className={cn("flex items-start gap-3 border-b border-slate-100 px-4 py-3.5 last:border-0 sm:px-5", n.unread && "bg-emerald-50/60")}>
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
              <Bell className="h-3.5 w-3.5 text-slate-500" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[13px] font-bold text-slate-900">{n.title}</p>
                {n.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />}
              </div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{n.body}</p>
            </div>
            <span className="shrink-0 text-[11px] text-slate-400">{n.time}</span>
          </li>
        ))}
        {list.length === 0 && <li className="px-6 py-8 text-center text-[13px] text-slate-500">{t("noNotifications")}</li>}
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
  onCurrencyChange,
  lang,
  money = usd,
}: {
  view: ClientView;
  t: T;
  onProfileSave: (patch: { phone: string; country: string; address: string; city: string; postcode: string }) => Promise<string | null>;
  onPasswordSave: (current: string, next: string) => Promise<string | null>;
  onCurrencyChange: (code: CurrencyCode) => void;
  lang: Lang;
  money?: (n: number) => string;
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
    [t("openingBalance"), money(c.openingBalance), true],
    [t("creditsLabel"), money(fin.credits), true],
    [t("debitsLabel"), money(fin.debits), true],
    [t("statusLabel"), c.status === "active" ? t("active") : t("suspended")],
    [t("tierLabel"), c.tier === "Private" ? t("tierPrivate") : c.tier === "Premium" ? t("tierPremium") : t("tierStandard")],
  ];

  const inputCls =
    "h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[16px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 sm:text-sm";

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
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
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
              <span className="mb-1.5 block text-[13px] font-medium text-slate-600">{t("phone")}</span>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-600">{t("country")}</span>
              <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputCls} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-600">{t("address")}</span>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-600">{t("city")}</span>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-600">{t("postcode")}</span>
              <input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} className={inputCls} />
            </label>
            <div className="flex justify-end gap-2.5 sm:col-span-2">
              <button onClick={() => setEditing(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100">
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
              <div key={k} className="flex items-center justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
                <dt className="shrink-0 text-[12.5px] font-medium text-slate-500">{k}</dt>
                <dd className="truncate text-[13px] font-semibold text-slate-900" dir={ltr || /^[+$\d]/.test(v) ? "ltr" : undefined}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {/* Source of Funds — free text curated by the Super Admin (#9) */}
        <div className="mt-5 rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-4">
          <p className="text-[12px] font-bold uppercase tracking-wide text-emerald-700">{t("sourceOfFunds")}</p>
          <p className="mt-1 text-[12px] text-slate-500">{t("sourceOfFundsSub")}</p>
          <p className="mt-2 break-words text-[13px] font-semibold leading-relaxed text-slate-700" dir="auto">
            {c.sourceOfFunds?.trim() ? c.sourceOfFunds : <span className="font-normal italic text-slate-400">{t("sourceOfFundsEmpty")}</span>}
          </p>
        </div>

        {/* Display currency — one formatter drives every figure on the dashboard */}
        <div className="mt-4 border-t border-slate-200/70 pt-4">
          <label className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-slate-600">{t("displayCurrency")}</span>
            <select
              value={c.currency ?? "USD"}
              onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
              aria-label={t("displayCurrency")}
              dir="ltr"
              className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-[16px] font-bold text-slate-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 sm:text-sm"
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code} · {CURRENCY_META[code]?.label ?? code}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{t("currencyNote")}</p>
        </div>

        <div className="mt-5 border-t border-slate-200/70 pt-4">
          {!pwOpen ? (
            <button onClick={() => setPwOpen(true)} className="text-[13px] font-bold text-emerald-600 transition-colors hover:text-emerald-700">
              {t("changePassword")}
            </button>
          ) : (
            <div className="max-w-sm space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-slate-600">{t("currentPassword")}</span>
                <PasswordInput theme="light" value={pw.current} onChange={(v) => setPw({ ...pw, current: v })} autoComplete="current-password" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-slate-600">{t("newPassword")}</span>
                <PasswordInput theme="light" value={pw.next} onChange={(v) => setPw({ ...pw, next: v })} autoComplete="new-password" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-slate-600">{t("confirmNewPassword")}</span>
                <PasswordInput theme="light" value={pw.confirm} onChange={(v) => setPw({ ...pw, confirm: v })} autoComplete="new-password" />
              </label>
              {pwError && <p className="rounded-lg bg-amber-50 px-3.5 py-2 text-[12.5px] font-semibold text-amber-800 ring-1 ring-amber-600/15">{pwError}</p>}
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => {
                    setPwOpen(false);
                    setPwError(null);
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
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
        <p className="mb-3.5 text-[12.5px] text-slate-500">{t("contactSub")}</p>
        <ContactButtonsCard variant="light" />
      </div>
    </Card>
  );
}

/* ---------------- market overview ---------------- */

export function MarketStrip({ coins, stocks, t, singleColumn, money = usd }: { coins: Coin[]; stocks: Coin[]; t: T; singleColumn?: boolean; money?: (n: number) => string }) {
  const top = [...coins, ...stocks].slice(0, 6);
  return (
    <Card className="overflow-hidden">
      <SectionTitle title={t("marketOverview")} right={<LiveChip t={t} />} />
      <div className={cn("grid grid-cols-1 gap-2.5 p-4 sm:p-5", !singleColumn && "sm:grid-cols-2")}>
        {top.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white px-3.5 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <CoinBadge glyph={c.glyph} gradient={c.gradient} className="h-8 w-8 text-[12px]" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-slate-900">{c.name}</p>
                <p className="truncate text-[11px] text-slate-400" dir="ltr">
                  {c.symbol}
                  {c.exchange ? ` · ${c.exchange}` : ""}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-end">
              <p className="whitespace-nowrap text-[13px] font-bold tabular-nums text-slate-900" dir="ltr">
                {money(c.price)}
              </p>
              <p className={cn("text-[11px] font-bold tabular-nums", c.change24h >= 0 ? "text-emerald-600" : "text-amber-600")} dir="ltr">
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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11.5px] font-bold text-amber-800 ring-1 ring-amber-600/20">
        <Crown className="h-3.5 w-3.5" /> {t("tierPrivate")}
      </span>
    );
  }
  if (tier === "Premium") {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11.5px] font-bold text-emerald-600 ring-1 ring-emerald-600/20">{t("tierPremium")}</span>;
  }
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-bold text-slate-600 ring-1 ring-white/10">{t("tierStandard")}</span>;
}

/** Green Verified badge with a check icon — rendered NEXT TO the client name. */
export function VerifiedBadge({ verified, t }: { verified: boolean; t: T }) {
  if (!verified) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11.5px] font-bold text-amber-800 ring-1 ring-amber-600/20">
        <BadgeCheck className="h-3.5 w-3.5" /> {t("kycPendingBadge")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11.5px] font-bold text-emerald-700 ring-1 ring-emerald-600/25">
      <BadgeCheck className="h-3.5 w-3.5" /> {t("verifiedBadge")}
    </span>
  );
}

/** "Private" privacy badge — rendered UNDER the client name. */
export function PrivateBadge({ t }: { t: T }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-bold text-slate-600 ring-1 ring-white/15">
      <Lock className="h-3 w-3" /> {t("privateBadge")}
    </span>
  );
}

export function WalletGlyph() {
  return <Wallet className="h-4 w-4" />;
}
