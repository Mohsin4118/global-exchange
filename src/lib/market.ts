export interface Coin {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  color: string; // brand color for the coin badge
  gradient: string; // tailwind gradient classes for the coin badge
  glyph: string; // short glyph shown inside badge
  exchange?: string; // listing venue (e.g. Tadawul, DFM) — stocks only
  kind?: "crypto" | "stock";
}

export const INITIAL_COINS: Coin[] = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    price: 77397.0,
    change24h: -0.14,
    color: "#f7931a",
    gradient: "from-[#f6bd63] to-[#c96f0a]",
    glyph: "₿",
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    price: 2487.63,
    change24h: -1.06,
    color: "#627eea",
    gradient: "from-[#8ea8f5] to-[#4462c8]",
    glyph: "Ξ",
  },
  {
    id: "tether",
    name: "Tether",
    symbol: "USDT",
    price: 0.9998,
    change24h: 0.02,
    color: "#26a17b",
    gradient: "from-[#4fd1a5] to-[#127a55]",
    glyph: "₮",
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    price: 101.02,
    change24h: -0.46,
    color: "#9945ff",
    gradient: "from-[#b57bff] to-[#6b2bd9]",
    glyph: "◎",
  },
  {
    id: "bnb",
    name: "BNB",
    symbol: "BNB",
    price: 719.11,
    change24h: -0.56,
    color: "#f3ba2f",
    gradient: "from-[#f7d06b] to-[#c8931a]",
    glyph: "◇",
  },
  {
    id: "xrp",
    name: "XRP",
    symbol: "XRP",
    price: 1.4,
    change24h: 1.59,
    color: "#23292f",
    gradient: "from-[#5a6673] to-[#14181d]",
    glyph: "✕",
  },
  {
    id: "dogecoin",
    name: "Dogecoin",
    symbol: "DOGE",
    price: 0.0829,
    change24h: -1.55,
    color: "#c2a633",
    gradient: "from-[#d9c05e] to-[#96771a]",
    glyph: "Ð",
  },
];

/** Equities available on the platform — quoted in USD (converted from native SAR/AED quotes). */
export const STOCKS: Coin[] = [
  {
    id: "aramco",
    name: "Saudi Aramco",
    symbol: "2222",
    price: 7.28, // ≈ SAR 27.30 on Tadawul
    change24h: 0.42,
    color: "#0f7a4d",
    gradient: "from-[#4fd1a5] to-[#0e7a4f]",
    glyph: "A",
    exchange: "Tadawul",
    kind: "stock",
  },
  {
    id: "salik",
    name: "Salik Company",
    symbol: "SALIK",
    price: 1.4, // ≈ AED 5.15 on DFM
    change24h: -0.31,
    color: "#0f5a7a",
    gradient: "from-[#6ec2e0] to-[#1a6a8f]",
    glyph: "S",
    exchange: "DFM",
    kind: "stock",
  },
];

export const TICKER_COINS = [
  "bitcoin",
  "ethereum",
  "solana",
  "bnb",
  "xrp",
  "dogecoin",
  "tether",
] as const;

/** Fiat currencies supported for on-ramp/off-ramp (price = USD value of 1 unit). */
export const FIAT_CURRENCIES: Coin[] = [
  {
    id: "usd",
    name: "US Dollar",
    symbol: "USD",
    price: 1.0,
    change24h: 0.0,
    color: "#4a7dbd",
    gradient: "from-[#7fb2e8] to-[#2f5a94]",
    glyph: "$",
  },
  {
    id: "gbp",
    name: "British Pound",
    symbol: "GBP",
    price: 1.2712,
    change24h: 0.05,
    color: "#8f2d2d",
    gradient: "from-[#e0908a] to-[#9c3434]",
    glyph: "£",
  },
  {
    id: "eur",
    name: "Euro",
    symbol: "EUR",
    price: 1.0842,
    change24h: -0.02,
    color: "#2d5a8f",
    gradient: "from-[#8ab2e0] to-[#34609c]",
    glyph: "€",
  },
  {
    id: "sar",
    name: "Saudi Riyal",
    symbol: "SAR",
    price: 0.2666,
    change24h: 0.01,
    color: "#0f7a4d",
    gradient: "from-[#4fd1a5] to-[#127a55]",
    glyph: "﷼",
  },
  {
    id: "qar",
    name: "Qatari Riyal",
    symbol: "QAR",
    price: 0.2747,
    change24h: 0.0,
    color: "#7a1f38",
    gradient: "from-[#d4708a] to-[#8f2440]",
    glyph: "ق",
  },
  {
    id: "aed",
    name: "UAE Dirham",
    symbol: "AED",
    price: 0.2723,
    change24h: 0.02,
    color: "#0f5a7a",
    gradient: "from-[#6ec2e0] to-[#1a6a8f]",
    glyph: "د",
  },
];

/** Random-walk tick applied client-side only (avoids hydration mismatch). */
export function tickCoin(coin: Coin): Coin {
  const isStable = coin.id === "tether";
  if (isStable) {
    // Mean-revert around the $1 peg, staying within ±0.15%
    const pull = (1 - coin.price) * 0.5;
    const noise = (Math.random() - 0.5) * 0.0004;
    const price = Math.min(1.0015, Math.max(0.9985, coin.price + pull + noise));
    return { ...coin, price, change24h: (price - 1) * 100 };
  }
  const isStock = coin.kind === "stock";
  const drift = (Math.random() - 0.485) * (isStock ? 0.0011 : 0.0025); // equities move ~half as much as crypto
  const price = Math.max(0.0001, coin.price * (1 + drift));
  const change = coin.change24h + (Math.random() - 0.5) * (isStock ? 0.02 : 0.05);
  return { ...coin, price, change24h: change };
}

export function formatPrice(price: number): string {
  const digits = price >= 100 ? 2 : price >= 1 ? 4 : 4;
  return `$${price.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function formatChange(change: number): string {
  return `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;
}

export interface ActivityItem {
  id: number;
  route: string;
  amount: string;
  status: "Completed" | "Processing";
}

export const INITIAL_ACTIVITY: ActivityItem[] = [
  { id: 1, route: "BTC → ETH", amount: "0.42 BTC → ETH", status: "Completed" },
  { id: 2, route: "USDT → BTC", amount: "12,500 USDT → BTC", status: "Completed" },
  { id: 3, route: "ETH → USDT", amount: "3.5 ETH → USDT", status: "Processing" },
];

/** Deterministic pseudo-random sparkline (stable across server/client). */
export function sparkline(seed: number, points = 40, volatility = 1): number[] {
  const values: number[] = [];
  let v = 50;
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < points; i++) {
    v += (rand() - 0.48) * 8 * volatility;
    v = Math.min(92, Math.max(8, v));
    values.push(v);
  }
  return values;
}

export function sparklinePath(values: number[], width: number, height: number): string {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  return values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
