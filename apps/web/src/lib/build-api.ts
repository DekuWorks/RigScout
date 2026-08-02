import { apiFetch } from "./api";
import type { Build, CompatibilityResponse } from "@/types/builds";

export function evaluateBuild(build: Build) {
  return apiFetch<CompatibilityResponse>("/v1/builds/evaluate", {
    method: "POST",
    body: JSON.stringify({
      items: build.items.map((item) => ({
        slug: item.product.is_mock ? item.product.slug : undefined,
        category: item.category,
        name: item.product.name,
        specs: Object.fromEntries(
          (item.product.specs ?? []).map((spec) => [spec.key, spec.value]),
        ),
        price_minor:
          item.paid_price_minor ??
          item.product.best_price_minor + item.product.best_shipping_minor,
      })),
    }),
  });
}
