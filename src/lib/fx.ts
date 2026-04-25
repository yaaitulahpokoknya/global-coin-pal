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

/** Population standard deviation over the most recent `window` points. */
export function stdev(values: number[], window: number) {
  const slice = values.slice(0, Math.min(window, values.length));
  if (slice.length === 0) return 0;
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  const variance = slice.reduce((acc, v) => acc + (v - mean) ** 2, 0) / slice.length;
  return Math.sqrt(variance);
}

export type Recommendation = {
  signal: "buy" | "hold" | "wait";
  headline: string;
  detail: string;
  changePct: number;
  /** 0–100, how strongly the data supports the signal */
  confidence: number;
  /** Best/worst plausible rate within ±1 stdev band */
  scenario: { best: number; worst: number; today: number };
};

/**
 * Recommendation logic: compare today's rate (most recent) vs 7-day SMA.
 * `points` must be sorted DESC by recorded_at (newest first).
 *
 * Confidence is derived from how far today's rate sits outside the ±1 stdev
 * band — far outside = high confidence; inside = low confidence (just noise).
 *
 * Scenario gives users a plausible best/worst outcome (mean ± 1σ), so they
 * understand the recommendation is decision support, not a guarantee.
 */
export function recommend(quote: Currency, points: FxPoint[]): Recommendation {
  if (points.length === 0) {
    return {
      signal: "hold",
      headline: "Not enough data",
      detail: "FX history unavailable.",
      changePct: 0,
      confidence: 0,
      scenario: { best: 0, worst: 0, today: 0 },
    };
  }
  const rates = points.map((p) => p.rate);
  const today = rates[0];
  const avg7 = sma(rates, 7);
  const sd = stdev(rates, 7);
  const changePct = ((today - avg7) / avg7) * 100;

  // Confidence: how many stdevs is today from the mean? clamp 0–100.
  const zScore = sd > 0 ? Math.abs(today - avg7) / sd : 0;
  const confidence = Math.round(Math.min(100, zScore * 50));

  const scenario = {
    today,
    best: avg7 - sd, // best = cheapest rate to buy quote
    worst: avg7 + sd,
  };

  if (changePct < -0.4) {
    return {
      signal: "buy",
      headline: `Good time to buy ${quote}`,
      detail: `Rate is ${Math.abs(changePct).toFixed(2)}% below the 7-day average.`,
      changePct,
      confidence,
      scenario,
    };
  }
  if (changePct > 0.6) {
    return {
      signal: "wait",
      headline: `Consider waiting on ${quote}`,
      detail: `Rate is ${changePct.toFixed(2)}% above the 7-day average — likely to dip.`,
      changePct,
      confidence,
      scenario,
    };
  }
  return {
    signal: "hold",
    headline: `${quote} is stable`,
    detail: `Within ${changePct.toFixed(2)}% of the 7-day average.`,
    changePct,
    confidence,
    scenario,
  };
}
