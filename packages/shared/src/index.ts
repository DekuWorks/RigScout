/**
 * Shared constants and types used by the web app (and mirrored in Python docs).
 * Keep this package free of runtime framework dependencies.
 */

export const BRAND = {
  name: "RigScout",
  tagline: "Track. Compare. Build Smarter.",
  motto: "We scout. You build smarter.",
} as const;

/** Approved RigScout palette — do not replace without design approval. */
export const COLORS = {
  primary: "#0D6EFD",
  accent: "#00C2FF",
  navy: "#0F172A",
  slate: "#64748B",
  offWhite: "#F8FAFC",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
} as const;

export const PART_CATEGORIES = [
  "cpu",
  "gpu",
  "motherboard",
  "ram",
  "storage",
  "psu",
  "case",
  "cooling",
  "monitor",
  "peripherals",
] as const;

export type PartCategory = (typeof PART_CATEGORIES)[number];

export const PART_CATEGORY_LABELS: Record<PartCategory, string> = {
  cpu: "CPU",
  gpu: "GPU",
  motherboard: "Motherboard",
  ram: "RAM",
  storage: "Storage",
  psu: "PSU",
  case: "Case",
  cooling: "Cooling",
  monitor: "Monitor",
  peripherals: "Peripherals",
};

export type ListingCondition = "new" | "used" | "refurbished";

export type PlanTier = "free" | "scout_pro";

/** Feature entitlement boundaries for future Stripe billing. */
export const PLAN_LIMITS = {
  free: {
    maxBuilds: 2,
    maxWatchedProducts: 10,
    priceHistoryDays: 90,
    advancedAnalytics: false,
    fasterAlerts: false,
  },
  scout_pro: {
    maxBuilds: 25,
    maxWatchedProducts: 100,
    priceHistoryDays: 365,
    advancedAnalytics: true,
    fasterAlerts: true,
  },
} as const;

export type MoneyMinor = {
  /** Integer minor units (cents for USD). */
  amountMinor: number;
  currency: string;
};

export function formatMoney(amountMinor: number, currency = "USD", locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amountMinor / 100);
}

export function dealScoreLabel(score: number | null): string {
  if (score === null) return "Insufficient history";
  if (score >= 80) return "Excellent deal";
  if (score >= 65) return "Good deal";
  if (score >= 45) return "Fair price";
  if (score >= 25) return "Above average";
  return "Expensive";
}
