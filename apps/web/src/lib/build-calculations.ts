import { REQUIRED_BUILD_CATEGORIES, type Build, type BuildItem } from "@/types/builds";

export function itemCurrentPrice(item: BuildItem): number {
  const listing = item.product.listings?.find((entry) => entry.id === item.listing_id);
  return listing
    ? listing.price_minor + listing.shipping_minor
    : item.product.best_price_minor + item.product.best_shipping_minor;
}

export function buildTotals(build: Build) {
  const current = build.items.reduce(
    (sum, item) => sum + itemCurrentPrice(item) * item.quantity,
    0,
  );
  const paid = build.items.reduce(
    (sum, item) =>
      sum + (item.purchased ? (item.paid_price_minor ?? itemCurrentPrice(item)) * item.quantity : 0),
    0,
  );
  const retailForPurchased = build.items.reduce(
    (sum, item) => sum + (item.purchased ? itemCurrentPrice(item) * item.quantity : 0),
    0,
  );
  const targetRemaining =
    build.target_total_minor == null ? null : build.target_total_minor - current;

  return {
    current,
    paid,
    saved: Math.max(0, retailForPurchased - paid),
    targetRemaining,
  };
}

export function missingBuildCategories(build: Build): string[] {
  const selected = new Set(build.items.map((item) => item.category));
  return REQUIRED_BUILD_CATEGORIES.filter((category) => !selected.has(category));
}

export function buildCsv(build: Build): string {
  const rows = [
    ["Category", "Product", "Retailer", "Current price", "Purchased", "Paid price"],
    ...build.items.map((item) => {
      const listing = item.product.listings?.find((entry) => entry.id === item.listing_id);
      return [
        item.category,
        item.product.name,
        listing?.retailer ?? item.product.best_retailer,
        (itemCurrentPrice(item) / 100).toFixed(2),
        item.purchased ? "Yes" : "No",
        item.paid_price_minor == null ? "" : (item.paid_price_minor / 100).toFixed(2),
      ];
    }),
  ];
  return rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
}
