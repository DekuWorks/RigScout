import { useQuery } from "@tanstack/react-query";
import { formatMoney, PART_CATEGORIES, PART_CATEGORY_LABELS } from "@rigscout/shared";
import { useState } from "react";
import { Link } from "react-router-dom";
import { DealScoreBadge } from "@/components/catalog/DealScoreBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PriceChange } from "@/components/ui/PriceChange";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchDeals } from "@/lib/catalog-api";
import type { DealCard } from "@/types/catalog";

export function DealsPage() {
  const [category, setCategory] = useState("");
  const [marketplace, setMarketplace] = useState<"all" | "new" | "marketplace">("all");

  const query = useQuery({
    queryKey: ["deals", category, marketplace],
    queryFn: () =>
      fetchDeals({
        category: category || undefined,
        marketplace_only:
          marketplace === "all" ? undefined : marketplace === "marketplace",
      }),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rs-accent">Deals</p>
        <h1 className="mt-1 font-display text-3xl font-bold">Trending price drops</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Best deal scores and largest recent drops from the live catalog.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="text-sm">
          <span className="mr-2 text-[var(--muted)]">Category</span>
          <select
            className="rs-input w-auto"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All</option>
            {PART_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {PART_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mr-2 text-[var(--muted)]">Source</span>
          <select
            className="rs-input w-auto"
            value={marketplace}
            onChange={(e) => setMarketplace(e.target.value as typeof marketplace)}
          >
            <option value="all">New + marketplace</option>
            <option value="new">New / retailer</option>
            <option value="marketplace">Marketplace only</option>
          </select>
        </label>
      </div>

      {query.isLoading ? <Skeleton className="h-40 w-full" /> : null}
      {query.isError ? (
        <ErrorState
          message="Could not load deals. Start the API with npm run dev:api."
          onRetry={() => void query.refetch()}
        />
      ) : null}

      {query.data ? (
        <>
          <DealSection title="Best deal scores" items={query.data.best_deal_scores} />
          <DealSection title="Largest recent drops" items={query.data.largest_drops} />
          <DealSection title="Trending now" items={query.data.trending} />
        </>
      ) : null}
    </div>
  );
}

function DealSection({ title, items }: { title: string; items: DealCard[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title={`No ${title.toLowerCase()}`}
        description="Deals appear after products are synced into the catalog. Try another category filter once data exists."
      />
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((deal) => (
          <Link
            key={`${deal.slug}-${deal.retailer}-${deal.price_minor}`}
            to={`/app/discover/${deal.slug}`}
            className="rs-card rs-card-hover flex items-start justify-between gap-3 p-4"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-rs-accent">
                {PART_CATEGORY_LABELS[deal.category as keyof typeof PART_CATEGORY_LABELS] ??
                  deal.category}
              </p>
              <h3 className="mt-1 font-semibold">{deal.name}</h3>
              <p className="text-xs text-[var(--muted)]">
                {deal.retailer}
                {deal.is_marketplace ? " · marketplace" : ""}
                {deal.availability !== "in_stock" ? ` · ${deal.availability.replaceAll("_", " ")}` : ""}
              </p>
              <div className="mt-2">
                <DealScoreBadge score={deal.deal_score} compact />
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-xl font-bold">
                {formatMoney(deal.price_minor, deal.currency)}
              </p>
              <PriceChange className="mt-1 justify-end" deltaMinor={deal.price_delta_minor} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
