import type { Currency } from "./format";

export type FxPoint = { recorded_at: string; rate: number };

/** Convert between two currencies using USD-based rates (quote per 1 USD). */
export function convert(
  amount: number,
  from: Currency,
  to: Currency,
  ratesPerUsd: Record<Currency, number>,
) {
  if (from === to) return amount;
  const usd = amount / ratesPerUsd[from];
  return usd * ratesPerUsd[to];
}

export function pairRate(from: Currency, to: Currency, ratesPerUsd: Record<Currency, number>) {
  if (from === to) return 1;
  return ratesPerUsd[to] / ratesPerUsd[from];
}

/** Simple moving average. */
export function sma(values: number[], window: number) {
  if (values.length < window) return values.reduce((a, b) => a + b, 0) / values.length;
  const slice = values.slice(0, window);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

export type Recommendation = {
  signal: "buy" | "hold" | "wait";
  headline: string;
  detail: string;
  changePct: number;
};

/**
 * Recommendation logic: compare today's rate (most recent) vs 7-day SMA.
 * `points` must be sorted DESC by recorded_at (newest first).
 * If today's rate is meaningfully BELOW 7d average, it's a good time to buy
 * the quote currency (it's cheaper relative to recent history).
 */
export function recommend(quote: Currency, points: FxPoint[]): Recommendation {
  if (points.length === 0) {
    return { signal: "hold", headline: "Not enough data", detail: "FX history unavailable.", changePct: 0 };
  }
  const today = points[0].rate;
  const avg7 = sma(points.map((p) => p.rate), 7);
  const changePct = ((today - avg7) / avg7) * 100;

  if (changePct < -0.4) {
    return {
      signal: "buy",
      headline: `Good time to buy ${quote}`,
      detail: `Rate is ${Math.abs(changePct).toFixed(2)}% below the 7-day average.`,
      changePct,
    };
  }
  if (changePct > 0.6) {
    return {
      signal: "wait",
      headline: `Consider waiting on ${quote}`,
      detail: `Rate is ${changePct.toFixed(2)}% above the 7-day average — likely to dip.`,
      changePct,
    };
  }
  return {
    signal: "hold",
    headline: `${quote} is stable`,
    detail: `Within ${changePct.toFixed(2)}% of the 7-day average.`,
    changePct,
  };
}
