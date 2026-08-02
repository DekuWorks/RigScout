import { useQuery } from "@tanstack/react-query";
import { PART_CATEGORIES, PART_CATEGORY_LABELS } from "@rigscout/shared";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductCard } from "@/components/catalog/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { searchProducts } from "@/lib/catalog-api";

export function DiscoverPage() {
  const [params, setParams] = useSearchParams();
  const [draftQ, setDraftQ] = useState(params.get("q") ?? "");

  const filters = useMemo(
    () => ({
      q: params.get("q") ?? undefined,
      category: params.get("category") ?? undefined,
      brand: params.get("brand") ?? undefined,
      retailer: params.get("retailer") ?? undefined,
      condition: params.get("condition") ?? undefined,
      availability: params.get("availability") ?? undefined,
      min_price: params.get("min_price") ? Number(params.get("min_price")) : undefined,
      max_price: params.get("max_price") ? Number(params.get("max_price")) : undefined,
      sort: (params.get("sort") as "deal_score" | "lowest_price" | "price_drop" | "name") || "deal_score",
      page: Number(params.get("page") ?? "1"),
      page_size: 12,
    }),
    [params],
  );

  const query = useQuery({
    queryKey: ["products", filters],
    queryFn: () => searchProducts(filters),
  });

  function patchParams(next: Record<string, string | undefined>) {
    const copy = new URLSearchParams(params);
    Object.entries(next).forEach(([key, value]) => {
      if (!value) copy.delete(key);
      else copy.set(key, value);
    });
    if (!("page" in next)) copy.set("page", "1");
    setParams(copy);
  }

  const totalPages = query.data ? Math.max(1, Math.ceil(query.data.total / query.data.page_size)) : 1;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rs-accent">Discover</p>
        <h1 className="mt-1 font-display text-3xl font-bold">Find PC parts</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Compare mock retailer prices, deal scores, and recent movement. Live sources activate when
          credentials are configured.
        </p>
      </div>

      <form
        className="rs-card grid gap-3 p-4 md:grid-cols-[1fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          patchParams({ q: draftQ || undefined });
        }}
      >
        <label className="block text-sm md:col-span-1">
          <span className="sr-only">Search</span>
          <input
            className="rs-input"
            placeholder="Search parts, brands, models..."
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
          />
        </label>
        <button type="submit" className="rs-btn-primary">
          Search
        </button>
      </form>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="rs-card space-y-4 p-4 h-fit">
          <FilterSelect
            label="Category"
            value={filters.category ?? ""}
            onChange={(value) => patchParams({ category: value || undefined })}
            options={PART_CATEGORIES.map((c) => ({
              value: c,
              label: PART_CATEGORY_LABELS[c],
            }))}
          />
          <FilterSelect
            label="Brand"
            value={filters.brand ?? ""}
            onChange={(value) => patchParams({ brand: value || undefined })}
            options={(query.data?.facets.brands ?? []).map((b) => ({ value: b, label: b }))}
          />
          <FilterSelect
            label="Retailer"
            value={filters.retailer ?? ""}
            onChange={(value) => patchParams({ retailer: value || undefined })}
            options={(query.data?.facets.retailers ?? []).map((r) => ({ value: r, label: r }))}
          />
          <FilterSelect
            label="Condition"
            value={filters.condition ?? ""}
            onChange={(value) => patchParams({ condition: value || undefined })}
            options={[
              { value: "new", label: "New" },
              { value: "used", label: "Used" },
              { value: "refurbished", label: "Refurbished" },
            ]}
          />
          <FilterSelect
            label="Availability"
            value={filters.availability ?? ""}
            onChange={(value) => patchParams({ availability: value || undefined })}
            options={[
              { value: "in_stock", label: "In stock" },
              { value: "out_of_stock", label: "Out of stock" },
              { value: "preorder", label: "Preorder" },
            ]}
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs">
              <span className="mb-1 block text-[var(--muted)]">Min ¢</span>
              <input
                type="number"
                className="rs-input"
                placeholder="0"
                defaultValue={filters.min_price ?? ""}
                onBlur={(e) =>
                  patchParams({ min_price: e.target.value ? e.target.value : undefined })
                }
              />
            </label>
            <label className="block text-xs">
              <span className="mb-1 block text-[var(--muted)]">Max ¢</span>
              <input
                type="number"
                className="rs-input"
                placeholder="999999"
                defaultValue={filters.max_price ?? ""}
                onBlur={(e) =>
                  patchParams({ max_price: e.target.value ? e.target.value : undefined })
                }
              />
            </label>
          </div>
          <button
            type="button"
            className="rs-btn-secondary w-full text-xs"
            onClick={() => {
              setDraftQ("");
              setParams(new URLSearchParams());
            }}
          >
            Clear filters
          </button>
        </aside>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--muted)]">
              {query.data ? `${query.data.total} parts` : "Loading…"}
              {query.data?.is_mock ? " · MOCK catalog" : null}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-[var(--muted)]">Sort</span>
              <select
                className="rs-input w-auto"
                value={filters.sort}
                onChange={(e) => patchParams({ sort: e.target.value })}
              >
                <option value="deal_score">Deal score</option>
                <option value="lowest_price">Lowest price</option>
                <option value="price_drop">Price drop</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>

          {query.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : null}

          {query.isError ? (
            <ErrorState
              message="Could not load parts. Is the API running on port 8000?"
              onRetry={() => void query.refetch()}
            />
          ) : null}

          {query.data && query.data.items.length === 0 ? (
            <EmptyState
              title="No parts matched"
              description="Try clearing filters or searching a different brand/category."
            />
          ) : null}

          {query.data && query.data.items.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {query.data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : null}

          {query.data && totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                className="rs-btn-secondary"
                disabled={filters.page <= 1}
                onClick={() => patchParams({ page: String(filters.page - 1) })}
              >
                Previous
              </button>
              <span className="text-sm text-[var(--muted)]">
                Page {filters.page} / {totalPages}
              </span>
              <button
                type="button"
                className="rs-btn-secondary"
                disabled={filters.page >= totalPages}
                onClick={() => patchParams({ page: String(filters.page + 1) })}
              >
                Next
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-xs font-medium text-[var(--muted)]">{label}</span>
      <select className="rs-input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
