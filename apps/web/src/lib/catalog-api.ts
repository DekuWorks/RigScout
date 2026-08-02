import { apiFetch } from "./api";
import type { DealsResponse, ProductDetailResponse, ProductSearchResponse } from "@/types/catalog";

export type ProductSearchParams = {
  q?: string;
  category?: string;
  brand?: string;
  retailer?: string;
  condition?: string;
  availability?: string;
  min_price?: number;
  max_price?: number;
  sort?: "deal_score" | "lowest_price" | "price_drop" | "name";
  page?: number;
  page_size?: number;
};

export function searchProducts(params: ProductSearchParams = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== null) {
      qs.set(key, String(value));
    }
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiFetch<ProductSearchResponse>(`/v1/products${suffix}`);
}

export function fetchProduct(slug: string, historyDays = 90) {
  return apiFetch<ProductDetailResponse>(`/v1/products/${slug}?history_days=${historyDays}`);
}

export function fetchDeals(params: { category?: string; marketplace_only?: boolean } = {}) {
  const qs = new URLSearchParams();
  if (params.category) qs.set("category", params.category);
  if (params.marketplace_only !== undefined) {
    qs.set("marketplace_only", String(params.marketplace_only));
  }
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiFetch<DealsResponse>(`/v1/deals${suffix}`);
}
