export interface Coin {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  color: string; // brand color for the coin badge
  gradient: string; // tailwind gradient classes for the coin badge
  glyph: string; // short glyph shown inside badge
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

export const TICKER_COINS = [
  "bitcoin",
  "ethereum",
  "solana",
  "bnb",
  "xrp",
  "dogecoin",
  "tether",
] as const;

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
  const drift = (Math.random() - 0.485) * 0.0025; // ±~0.12% move
  const price = Math.max(0.0001, coin.price * (1 + drift));
  const change = coin.change24h + (Math.random() - 0.5) * 0.05;
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
