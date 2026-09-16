"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Search,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { sparkline, sparklinePath } from "@/lib/market";
import { ADMIN_MARKET_COINS, GROWTH_MONTHS, GROWTH_VALUES, usd } from "@/lib/admin-data";
import type { AdminCtx } from "./types";
import { Card, MonoId, PageHeader, StatCard } from "./ui";
import { cn } from "@/lib/utils";

/* ================= DASHBOARD ================= */

export function DashboardPage({ ctx }: { ctx: AdminCtx }) {
  const { clients, transactions } = ctx.state;

  const totalBalances = useMemo(() => clients.reduce((a, c) => a + c.balance, 0), [clients]);
  const volume = useMemo(
    () => transactions.filter((t) => t.status === "COMPLETED").reduce((a, t) => a + t.amount, 0),
    [transactions],
  );
  const activeCount = useMemo(() => clients.filter((c) => c.status === "ACTIVE").length, [clients]);
  const clientCount = clients.length;
  const recent = transactions.slice(0, 5);

  return (
    <div>
      <PageHeader title="Welcome back, Super Admin" subtitle="Overview of your platform performance and recent activity." />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Clients"
          value={String(clientCount)}
          sub={`${clientCount} new this month`}
          highlight={<span className="text-emerald-600">+{clientCount} this month</span>}
          icon={<Users className="h-5 w-5" />}
          iconBg="bg-emerald-500"
          tint
        />
        <StatCard
          label="Total Balances"
          value={usd(totalBalances)}
          sub="Across all accounts"
          icon={<Wallet className="h-5 w-5" />}
          iconBg="bg-blue-500"
        />
        <StatCard
          label="Transaction Volume"
          value={usd(volume)}
          sub="Completed transactions"
          icon={<ArrowLeftRight className="h-5 w-5" />}
          iconBg="bg-purple-500"
        />
        <StatCard
          label="Active Clients"
          value={String(activeCount)}
          sub="0 transactions today"
          highlight={<span className="text-emerald-600">100.0% of total</span>}
          icon={<UserCheck className="h-5 w-5" />}
          iconBg="bg-emerald-500"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.55fr_1fr]">
        {/* Client Growth */}
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3.5 bg-[#0f1c30] px-6 py-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/25">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </span>
            <div>
              <p className="text-[15px] font-bold text-white">Client Growth</p>
              <p className="text-xs text-slate-400">Last 6 months</p>
            </div>
          </div>
          <GrowthChart />
        </Card>

        {/* Recent Transactions */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between px-6 pt-6">
            <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
            <button
              onClick={() => ctx.navigate("transactions")}
              className="text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
            >
              View all
            </button>
          </div>
          <div className="mt-4 flex-1 overflow-x-auto px-2 pb-4">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[13px] font-medium text-slate-500">
                  <th className="px-4 py-2.5 font-medium">ID</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">Client</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3.5"><MonoId id={t.id} /></td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{t.date}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn("text-[13px] font-semibold", t.type === "CREDIT" ? "text-emerald-500" : "text-amber-600")}>
                        {t.type}
                      </span>
                    </td>
                    <td className="max-w-[190px] truncate px-4 py-3.5 font-semibold text-slate-900">{t.clientName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* Growth line chart — smooth curve, emerald gradient fill */

function GrowthChart() {
  const W = 760;
  const H = 300;
  const PL = 44;
  const PR = 20;
  const PT = 18;
  const PB = 34;
  const max = 16;

  const pts = GROWTH_VALUES.map((v, i) => {
    const x = PL + (i * (W - PL - PR)) / (GROWTH_VALUES.length - 1);
    const y = H - PB - (v / max) * (H - PT - PB);
    return [x, y] as const;
  });

  // Catmull-Rom → bezier smoothing
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  const area = `${d} L${pts[pts.length - 1][0]},${H - PB} L${pts[0][0]},${H - PB} Z`;

  return (
    <div className="px-4 py-5">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Client growth chart">
        <defs>
          <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[0, 4, 8, 12, 16].map((tick) => {
          const y = H - PB - (tick / max) * (H - PT - PB);
          return (
            <g key={tick}>
              <text x={PL - 12} y={y + 4} textAnchor="end" className="fill-slate-400" fontSize="12">
                {tick}
              </text>
            </g>
          );
        })}
        <path d={area} fill="url(#growthFill)" />
        <path d={d} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
        {GROWTH_MONTHS.map((m, i) => {
          const x = PL + (i * (W - PL - PR)) / (GROWTH_MONTHS.length - 1);
          return (
            <text key={m} x={x} y={H - 10} textAnchor="middle" className="fill-slate-500" fontSize="12">
              {m}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ================= FINANCIAL OVERVIEW ================= */

export function FinancialPage({ ctx }: { ctx: AdminCtx }) {
  const { clients, transactions } = ctx.state;

  const totalValue = useMemo(() => clients.reduce((a, c) => a + c.balance, 0), [clients]);
  const credits = useMemo(
    () => transactions.filter((t) => t.type === "CREDIT" && t.status === "COMPLETED").reduce((a, t) => a + t.amount, 0),
    [transactions],
  );
  const debits = useMemo(
    () => transactions.filter((t) => t.type === "DEBIT" && t.status === "COMPLETED").reduce((a, t) => a + t.amount, 0),
    [transactions],
  );
  const creditCount = transactions.filter((t) => t.type === "CREDIT" && t.status === "COMPLETED").length;
  const debitCount = transactions.filter((t) => t.type === "DEBIT" && t.status === "COMPLETED").length;
  const net = credits - debits;
  // Top clients ranked by their latest completed transaction balance (matches the platform)
  const top5 = useMemo(() => {
    const latest = new Map<string, number>();
    for (const t of transactions) {
      if (t.status !== "COMPLETED") continue;
      if (!latest.has(t.clientId)) latest.set(t.clientId, t.balanceAfter);
    }
    return [...clients]
      .map((c) => ({ ...c, rank: latest.get(c.id) ?? c.balance }))
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 5);
  }, [clients, transactions]);
  const creditPct = credits + debits > 0 ? (credits / (credits + debits)) * 100 : 100;

  const months = ["Apr 26", "May 26", "Jun 26", "Jul 26", "Aug 26", "Sep 26"];
  const monthlyCredits = [0, 0, 0, 0, 0, credits];

  return (
    <div>
      <PageHeader
        title="Financial Overview"
        subtitle="Comprehensive view of your platform's financial health and performance."
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Account Value"
          value={usd(totalValue)}
          sub="Across all client accounts"
          icon={<Wallet className="h-5 w-5" />}
          iconBg="bg-emerald-500"
        />
        <StatCard
          label="Total Credits"
          value={usd(credits)}
          sub="Completed credit transactions"
          link={
            <button onClick={() => ctx.navigate("transactions")} className="text-emerald-600 hover:text-emerald-700">
              {creditCount} transactions
            </button>
          }
          icon={<ArrowUpRight className="h-5 w-5" />}
          iconBg="bg-emerald-500"
        />
        <StatCard
          label="Total Debits"
          value={usd(debits)}
          sub="Completed debit transactions"
          link={
            <button onClick={() => ctx.navigate("transactions")} className="text-amber-600 hover:text-amber-700">
              {debitCount} transactions
            </button>
          }
          icon={<ArrowDownRight className="h-5 w-5" />}
          iconBg="bg-amber-500"
        />
        <StatCard
          label="Net Flow"
          value={usd(net)}
          sub={net >= 0 ? "Positive cash flow" : "Negative cash flow"}
          highlight={<span className="text-emerald-600">+{((net / Math.max(credits, 1)) * 100).toFixed(1)}%</span>}
          icon={<TrendingUp className="h-5 w-5" />}
          iconBg="bg-emerald-500"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.55fr_1fr]">
        {/* Monthly volume */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Monthly Transaction Volume</h2>
            <span className="text-[13px] text-slate-400">Last 6 months</span>
          </div>
          <VolumeBarChart months={months} values={monthlyCredits} />
          <div className="mt-2 flex items-center justify-center gap-6 text-[13px] text-slate-600">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-emerald-500" /> Credits
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-amber-500" /> Debits
            </span>
          </div>
        </Card>

        {/* Donut */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Transaction Types Distribution</h2>
            <span className="text-[13px] text-slate-400">All time</span>
          </div>
          <div className="flex items-center justify-center py-10">
            <Donut pct={creditPct} />
          </div>
          <div className="flex items-center justify-center gap-6 text-[13px] text-slate-600">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Credits {creditPct.toFixed(0)}%
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Debits {(100 - creditPct).toFixed(0)}%
            </span>
          </div>
        </Card>
      </div>

      {/* Top clients */}
      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Top Clients by Balance</h2>
          <span className="text-[13px] text-slate-400">Top 5</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[13px] font-medium text-slate-500">
                <th className="py-2.5 pr-4 font-medium">#</th>
                <th className="py-2.5 pr-4 font-medium">Client</th>
                <th className="py-2.5 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {top5.map((c, i) => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-3.5 pr-4 text-slate-500">{i + 1}</td>
                  <td className="max-w-[420px] truncate py-3.5 pr-4 font-semibold text-slate-900">
                    <button className="hover:text-emerald-600" onClick={() => ctx.navigate("client-detail", c.id)}>
                      {c.name}
                    </button>
                  </td>
                  <td className="whitespace-nowrap py-3.5 text-right font-bold text-emerald-500">{usd(c.rank)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function VolumeBarChart({ months, values }: { months: string[]; values: number[] }) {
  const W = 760;
  const H = 300;
  const PL = 56;
  const PR = 16;
  const PT = 16;
  const PB = 36;
  const max = 8_000_000;
  const bw = 22;

  const ticks = [0, 2, 4, 6, 8];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-6 h-auto w-full" role="img" aria-label="Monthly transaction volume chart">
      {ticks.map((t) => {
        const y = H - PB - (t * 1_000_000 / max) * (H - PT - PB);
        return (
          <text key={t} x={PL - 12} y={y + 4} textAnchor="end" className="fill-slate-400" fontSize="12">
            {t === 0 ? "$0" : `$${t.toFixed(1)}M`}
          </text>
        );
      })}
      {months.map((m, i) => {
        const x = PL + (i * (W - PL - PR)) / months.length + (W - PL - PR) / months.length / 2;
        const v = values[i] ?? 0;
        const h = (v / max) * (H - PT - PB);
        return (
          <g key={m}>
            {v > 0 && (
              <rect x={x - bw / 2} y={H - PB - h} width={bw} height={Math.max(h, 4)} rx={4} fill="#10b981" />
            )}
            <text x={x} y={H - 12} textAnchor="middle" className="fill-slate-500" fontSize="12">
              {m}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Donut({ pct }: { pct: number }) {
  const r = 78;
  const sw = 26;
  const c = 2 * Math.PI * r;
  const filled = (pct / 100) * c;
  return (
    <svg viewBox="0 0 220 220" className="h-56 w-56" role="img" aria-label="Transaction types donut chart">
      <circle cx="110" cy="110" r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
      <circle
        cx="110"
        cy="110"
        r={r}
        fill="none"
        stroke="#10b981"
        strokeWidth={sw}
        strokeLinecap="butt"
        strokeDasharray={`${filled} ${c - filled}`}
        transform="rotate(-90 110 110)"
      />
      {pct >= 99.5 && <line x1="110" y1="110" x2="196" y2="110" stroke="#ffffff" strokeWidth="3" />}
    </svg>
  );
}

/* ================= MARKET OVERVIEW ================= */

const RANGES = ["1H", "1D", "1W", "1M", "3M", "1Y"] as const;

export function MarketPage({ ctx: _ctx }: { ctx: AdminCtx }) {
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<string>("1W");

  const filtered = ADMIN_MARKET_COINS.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.symbol.toLowerCase().includes(query.toLowerCase()),
  );
  const rangeIdx = RANGES.indexOf(range as (typeof RANGES)[number]);

  return (
    <div>
      <PageHeader title="Market Overview" subtitle="Track real-time cryptocurrency prices and market trends." />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search coins..."
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors",
                range === r ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-800",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {filtered.map((coin, i) => {
          const up = (coin.change ?? 0) > 0;
          const flat = coin.change === null;
          const values = sparkline(1000 + i * 97 + rangeIdx * 13, 40, 0.8);
          const path = sparklinePath(values, 240, 44);
          return (
            <Card key={coin.symbol} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-bold text-white"
                    style={{ backgroundColor: coin.color }}
                  >
                    {coin.glyph}
                  </span>
                  <div>
                    <p className="text-sm font-bold leading-tight text-slate-900">{coin.name}</p>
                    <p className="text-xs text-slate-400">{coin.symbol}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
                    flat ? "bg-slate-100 text-slate-500" : up ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600",
                  )}
                >
                  {flat ? (
                    "— "
                  ) : (
                    <>
                      {up ? "↗ " : "↘ "}
                      {`${coin.change! > 0 ? "+" : ""}${coin.change!.toFixed(2)}%`}
                    </>
                  )}
                </span>
              </div>
              <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{coin.price}</p>
              <div className="mt-4">
                <svg viewBox="0 0 240 44" className="h-11 w-full" preserveAspectRatio="none">
                  <path
                    d={path}
                    fill="none"
                    stroke={flat ? "#94a3b8" : up ? "#10b981" : "#f59e0b"}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </Card>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <Card className="p-12 text-center text-sm text-slate-500">No coins match “{query}”.</Card>
      )}
    </div>
  );
}
