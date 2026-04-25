export const CURRENCIES = ["IDR", "USD", "SGD", "MYR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_META: Record<Currency, { name: string; flag: string; symbol: string; decimals: number }> = {
  IDR: { name: "Indonesian Rupiah", flag: "🇮🇩", symbol: "Rp", decimals: 0 },
  USD: { name: "US Dollar", flag: "🇺🇸", symbol: "$", decimals: 2 },
  SGD: { name: "Singapore Dollar", flag: "🇸🇬", symbol: "S$", decimals: 2 },
  MYR: { name: "Malaysian Ringgit", flag: "🇲🇾", symbol: "RM", decimals: 2 },
};

export function formatMoney(amount: number, currency: Currency) {
  const meta = CURRENCY_META[currency];
  const n = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  }).format(amount);
  return `${meta.symbol} ${n}`;
}

export function formatRelative(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
