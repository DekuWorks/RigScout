import { useQuery } from "@tanstack/react-query";
import { formatMoney, PART_CATEGORY_LABELS, type PartCategory } from "@rigscout/shared";
import { Bell, ExternalLink, Wrench } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { DealScoreBadge } from "@/components/catalog/DealScoreBadge";
import { PriceHistoryChart } from "@/components/catalog/PriceHistoryChart";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { PriceChange } from "@/components/ui/PriceChange";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchProduct } from "@/lib/catalog-api";
import { useState } from "react";

export function ProductDetailPage() {
  const { slug = "" } = useParams();
  const [range, setRange] = useState<30 | 90 | 365>(90);

  const query = useQuery({
    queryKey: ["product", slug, range],
    queryFn: () => fetchProduct(slug, range),
    enabled: Boolean(slug),
  });

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Product not found"
        message="This part may not exist in the demo catalog, or the API is offline."
        onRetry={() => void query.refetch()}
      />
    );
  }

  const { product, listings, price_history, stats, alternatives, affiliate_disclosure } = query.data;
  const categoryLabel =
    PART_CATEGORY_LABELS[product.category as PartCategory] ?? product.category;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rs-accent">
            {categoryLabel} · {product.brand}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold">{product.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">{product.beginner_blurb}</p>
          {product.is_mock ? (
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-rs-warning">
              MOCK / placeholder listing data
            </p>
          ) : null}
        </div>
        <div className="rs-card min-w-[220px] p-4">
          <p className="text-xs text-[var(--muted)]">Best price</p>
          <p className="font-display text-3xl font-bold">
            {formatMoney(product.best_price_minor, product.currency)}
          </p>
          <PriceChange className="mt-1" deltaMinor={product.price_delta_minor} />
          <div className="mt-3">
            <DealScoreBadge score={product.deal_score} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="rs-btn-primary" disabled title="Phase 4 — Build Lab">
          <Wrench className="h-4 w-4" aria-hidden />
          Add to build
        </button>
        <button type="button" className="rs-btn-secondary" disabled title="Phase 5 — Alerts">
          <Bell className="h-4 w-4" aria-hidden />
          Set price alert
        </button>
        <Link to="/app/discover" className="rs-btn-secondary">
          Back to Discover
        </Link>
      </div>

      <section className="rs-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Price history</h2>
          <div className="flex gap-2">
            {([30, 90, 365] as const).map((days) => (
              <button
                key={days}
                type="button"
                className={range === days ? "rs-btn-primary text-xs" : "rs-btn-secondary text-xs"}
                onClick={() => setRange(days)}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>
        <PriceHistoryChart points={price_history} currency={product.currency} />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(
            [
              ["30-day", stats.high_low.days_30],
              ["90-day", stats.high_low.days_90],
              ["365-day", stats.high_low.days_365],
            ] as const
          ).map(([label, window]) => (
            <div key={label} className="rounded-xl border border-[var(--card-border)] p-3 text-sm">
              <p className="text-[var(--muted)]">{label} high / low</p>
              <p className="mt-1 font-semibold">
                {window.high_minor != null ? formatMoney(window.high_minor) : "—"}
                {" / "}
                {window.low_minor != null ? formatMoney(window.low_minor) : "—"}
              </p>
            </div>
          ))}
        </div>
        {!stats.deal_score_reliable ? (
          <p className="mt-3 text-xs text-[var(--muted)]">
            Deal score may be unavailable when history is too limited.
          </p>
        ) : null}
      </section>

      <section className="rs-card overflow-hidden">
        <div className="border-b border-[var(--card-border)] px-5 py-4">
          <h2 className="font-display text-lg font-semibold">Retailer comparison</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">{affiliate_disclosure}</p>
        </div>
        <div className="divide-y divide-[var(--card-border)]">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            >
              <div>
                <p className="font-medium">{listing.retailer}</p>
                <p className="text-xs text-[var(--muted)]">
                  {listing.condition} · {listing.availability.replaceAll("_", " ")}
                  {listing.is_marketplace ? " · marketplace" : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <DealScoreBadge score={listing.deal_score} compact />
                <div className="text-right">
                  <p className="font-display text-lg font-bold">
                    {formatMoney(listing.price_minor, listing.currency)}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Ship {formatMoney(listing.shipping_minor, listing.currency)}
                  </p>
                </div>
                <a
                  href={listing.product_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rs-btn-secondary text-xs"
                >
                  View
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rs-card p-5">
        <h2 className="font-display text-lg font-semibold">Specifications</h2>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2">
          {product.specs.map((spec) => (
            <div
              key={spec.key}
              className="flex items-center justify-between rounded-xl border border-[var(--card-border)] px-3 py-2 text-sm"
            >
              <dt className="text-[var(--muted)]">{spec.key}</dt>
              <dd className="font-medium">
                {spec.value}
                {spec.unit ? ` ${spec.unit}` : ""}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {alternatives.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Similar alternatives</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {alternatives.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
