import type { Currency } from "./format";
import { convert } from "./fx";

export type TxLite = {
  from_amount: number | null;
  from_currency: string | null;
  country: string | null;
  created_at: string;
};

export type FraudInput = {
  amount: number;
  currency: Currency;
  country: string;
  counterparty: string;
  recentTx: TxLite[];
  ratesPerUsd: Record<Currency, number>;
};

export type FraudResult = {
  riskScore: number; // 0-100
  level: "low" | "medium" | "high";
  reasons: string[];
  shouldBlock: boolean;
};

const HIGH_RISK_COUNTRIES = ["NG", "RU", "KP", "VE"];

export function evaluateFraud(input: FraudInput): FraudResult {
  const reasons: string[] = [];
  let score = 0;

  // Convert amount to USD for thresholding
  const usd = convert(input.amount, input.currency, "USD", input.ratesPerUsd);

  // Rule 1: Large amount
  if (usd >= 5000) {
    score += 45;
    reasons.push(`Large transfer: ~$${usd.toFixed(0)} USD equivalent`);
  } else if (usd >= 1500) {
    score += 20;
    reasons.push(`Above-average amount: ~$${usd.toFixed(0)} USD`);
  }

  // Rule 2: High-risk destination
  if (HIGH_RISK_COUNTRIES.includes(input.country)) {
    score += 40;
    reasons.push(`Destination country (${input.country}) flagged as high risk`);
  }

  // Rule 3: Velocity — more than 3 outgoing tx in last 10 minutes
  const tenMinAgo = Date.now() - 10 * 60 * 1000;
  const recent = input.recentTx.filter((t) => new Date(t.created_at).getTime() > tenMinAgo);
  if (recent.length >= 3) {
    score += 30;
    reasons.push(`High velocity: ${recent.length} transactions in last 10 minutes`);
  }

  // Rule 4: New counterparty + large
  if (usd >= 1000 && input.counterparty.toLowerCase().includes("unknown")) {
    score += 15;
    reasons.push("Large transfer to unknown recipient");
  }

  // Rule 5: Round-number flag (common in test fraud)
  if (usd >= 1000 && usd % 1000 === 0) {
    score += 5;
    reasons.push("Suspicious round-number amount");
  }

  score = Math.min(100, score);
  const level = score >= 70 ? "high" : score >= 35 ? "medium" : "low";
  return {
    riskScore: score,
    level,
    reasons,
    shouldBlock: score >= 70,
  };
}
