export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  description: string;
  beginner_blurb: string;
  best_price_minor: number;
  best_shipping_minor: number;
  currency: string;
  best_retailer: string;
  condition: string;
  availability: string;
  deal_score: number | null;
  price_delta_minor: number;
  listing_count: number;
  is_mock: boolean;
};

export type ProductSearchResponse = {
  is_mock: boolean;
  source?: "empty" | "supabase";
  total: number;
  page: number;
  page_size: number;
  items: ProductSummary[];
  facets: {
    brands: string[];
    retailers: string[];
    categories: string[];
  };
};

export type RetailerListing = {
  id: string;
  retailer: string;
  retailer_slug: string;
  price_minor: number;
  shipping_minor: number;
  currency: string;
  condition: string;
  availability: string;
  deal_score: number | null;
  product_url: string;
  is_marketplace: boolean;
  is_mock: boolean;
};

export type PricePoint = {
  recorded_at: string;
  price_minor: number;
};

export type ProductDetailResponse = {
  is_mock: boolean;
  source?: "empty" | "supabase";
  product: ProductSummary & {
    specs: Array<{ key: string; value: string; unit: string | null }>;
  };
  listings: RetailerListing[];
  price_history: PricePoint[];
  stats: {
    current_minor: number;
    high_low: {
      days_30: { high_minor: number | null; low_minor: number | null };
      days_90: { high_minor: number | null; low_minor: number | null };
      days_365: { high_minor: number | null; low_minor: number | null };
    };
    sample_count: number;
    deal_score_reliable: boolean;
  };
  alternatives: ProductSummary[];
  affiliate_disclosure: string;
};

export type DealsResponse = {
  is_mock: boolean;
  source?: "empty" | "supabase";
  trending: DealCard[];
  largest_drops: DealCard[];
  best_deal_scores: DealCard[];
};

export type DealCard = {
  product_id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  retailer: string;
  price_minor: number;
  shipping_minor: number;
  currency: string;
  deal_score: number | null;
  price_delta_minor: number;
  condition: string;
  availability: string;
  is_marketplace: boolean;
  is_mock: boolean;
  product_url: string;
};
