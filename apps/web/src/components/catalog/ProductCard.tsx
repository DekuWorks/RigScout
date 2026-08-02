import { formatMoney, PART_CATEGORY_LABELS, type PartCategory } from "@rigscout/shared";
import { Link } from "react-router-dom";
import { PriceChange } from "@/components/ui/PriceChange";
import type { ProductSummary } from "@/types/catalog";
import { DealScoreBadge } from "./DealScoreBadge";

type ProductCardProps = {
  product: ProductSummary;
};

export function ProductCard({ product }: ProductCardProps) {
  const categoryLabel =
    PART_CATEGORY_LABELS[product.category as PartCategory] ?? product.category;

  return (
    <Link
      to={`/app/discover/${product.slug}`}
      className="rs-card rs-card-hover flex flex-col gap-3 p-4 focus-visible:outline-offset-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-rs-accent">
            {categoryLabel}
          </p>
          <h3 className="mt-1 font-display text-base font-semibold leading-snug">{product.name}</h3>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            {product.brand} · {product.best_retailer}
          </p>
        </div>
        <DealScoreBadge score={product.deal_score} compact />
      </div>

      <div className="mt-auto">
        <p className="font-display text-xl font-bold">
          {formatMoney(product.best_price_minor, product.currency)}
        </p>
        <PriceChange className="mt-1" deltaMinor={product.price_delta_minor} />
        {product.is_mock ? (
          <p className="mt-2 text-[10px] uppercase tracking-wide text-[var(--muted)]">MOCK data</p>
        ) : null}
      </div>
    </Link>
  );
}
