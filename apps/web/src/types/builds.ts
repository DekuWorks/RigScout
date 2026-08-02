import type { ProductSummary, RetailerListing } from "./catalog";

export const REQUIRED_BUILD_CATEGORIES = [
  "cpu",
  "motherboard",
  "gpu",
  "ram",
  "storage",
  "psu",
  "case",
  "cooling",
] as const;

export type BuildCategory = (typeof REQUIRED_BUILD_CATEGORIES)[number];

export type BuildProduct = ProductSummary & {
  specs?: Array<{ key: string; value: string; unit: string | null }>;
  listings?: RetailerListing[];
};

export type BuildItem = {
  id: string;
  build_id: string;
  product_id: string;
  listing_id: string | null;
  category: string;
  quantity: number;
  purchased: boolean;
  paid_price_minor: number | null;
  notes: string | null;
  product: BuildProduct;
};

export type Build = {
  id: string;
  user_id: string;
  name: string;
  notes: string | null;
  is_public: boolean;
  share_slug: string | null;
  status: "in_progress" | "completed" | "archived";
  target_total_minor: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
  items: BuildItem[];
};

export type CompatibilityMessage = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
};

export type CompatibilityResponse = {
  guidance_only: true;
  messages: CompatibilityMessage[];
  totals: {
    item_count: number;
    price_minor: number;
    known_tdp_watts: number;
    recommended_psu_watts: number;
  };
};
