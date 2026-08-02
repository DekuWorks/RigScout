import { describe, expect, it } from "vitest";
import { buildCsv, buildTotals, missingBuildCategories } from "./build-calculations";
import type { Build } from "@/types/builds";

const build: Build = {
  id: "build-1",
  user_id: "guest",
  name: "Test build",
  notes: null,
  is_public: false,
  share_slug: null,
  status: "in_progress",
  target_total_minor: 100_000,
  currency: "USD",
  created_at: "2026-08-02T00:00:00Z",
  updated_at: "2026-08-02T00:00:00Z",
  items: [
    {
      id: "item-1",
      build_id: "build-1",
      product_id: "cpu-1",
      listing_id: null,
      category: "cpu",
      quantity: 1,
      purchased: true,
      paid_price_minor: 25_000,
      notes: null,
      product: {
        id: "cpu-1",
        slug: "test-cpu",
        name: "Test CPU",
        brand: "Test",
        model: "CPU",
        category: "cpu",
        description: "",
        beginner_blurb: "",
        best_price_minor: 30_000,
        best_shipping_minor: 500,
        currency: "USD",
        best_retailer: "Test Shop",
        condition: "new",
        availability: "in_stock",
        deal_score: 80,
        price_delta_minor: -2_000,
        listing_count: 1,
        is_mock: true,
      },
    },
  ],
};

describe("build calculations", () => {
  it("calculates current, paid, saved, and target totals", () => {
    expect(buildTotals(build)).toEqual({
      current: 30_500,
      paid: 25_000,
      saved: 5_500,
      targetRemaining: 69_500,
    });
  });

  it("reports missing core categories and exports CSV", () => {
    expect(missingBuildCategories(build)).not.toContain("cpu");
    expect(missingBuildCategories(build)).toContain("gpu");
    expect(buildCsv(build)).toContain('"Test CPU"');
  });
});
