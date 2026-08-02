import { useQuery } from "@tanstack/react-query";
import { formatMoney, PART_CATEGORY_LABELS, type PartCategory } from "@rigscout/shared";
import { ArrowRight, Layers3 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { buildTotals, itemCurrentPrice } from "@/lib/build-calculations";
import { getPublicBuildBySlug } from "@/lib/builds";

function categoryLabel(category: string) {
  return PART_CATEGORY_LABELS[category as PartCategory] ?? category;
}

export function SharedBuildPage() {
  const { slug = "" } = useParams();
  const buildQuery = useQuery({
    queryKey: ["shared-build", slug],
    queryFn: () => getPublicBuildBySlug(slug),
    enabled: Boolean(slug),
  });

  if (buildQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (buildQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState
          message="This shared build could not be loaded."
          onRetry={() => void buildQuery.refetch()}
        />
      </div>
    );
  }

  const build = buildQuery.data;
  if (!build) {
    return (
      <div className="min-h-dvh">
        <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
          <Logo to="/" />
          <Link to="/signup" className="rs-btn-primary">
            Get started
          </Link>
        </header>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <ErrorState
            title="Build not found"
            message="This share link is invalid, expired, or no longer public."
          />
          <div className="mt-6 text-center">
            <Link to="/" className="rs-btn-secondary">
              Back to RigScout
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totals = buildTotals(build);

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Logo to="/" />
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-[var(--muted)] hover:text-[var(--fg)]">
            Log in
          </Link>
          <Link to="/signup" className="rs-btn-primary">
            Get started
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 pb-16 pt-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rs-accent">
            Shared build
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold">{build.name}</h1>
          {build.notes ? (
            <p className="mt-2 text-sm text-[var(--muted)]">{build.notes}</p>
          ) : (
            <p className="mt-2 text-sm text-[var(--muted)]">
              Read-only public link. Compatibility guidance is not included on shared views.
            </p>
          )}
        </div>

        <section className="grid gap-3 sm:grid-cols-3">
          <Metric label="Parts" value={String(build.items.length)} />
          <Metric label="Estimated total" value={formatMoney(totals.current, build.currency)} />
          <Metric
            label="Target"
            value={
              build.target_total_minor == null
                ? "—"
                : formatMoney(build.target_total_minor, build.currency)
            }
          />
        </section>

        <section className="rs-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[var(--card-border)] px-4 py-3">
            <Layers3 className="h-4 w-4 text-rs-accent" aria-hidden />
            <h2 className="font-semibold">Parts list</h2>
          </div>
          {build.items.length === 0 ? (
            <p className="px-4 py-8 text-sm text-[var(--muted)]">No parts in this build yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--card-border)]">
              {build.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                      {categoryLabel(item.category)}
                    </p>
                    <p className="truncate font-medium">{item.product.name}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {item.product.brand} · {item.product.best_retailer}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium tabular-nums">
                    {formatMoney(itemCurrentPrice(item) * item.quantity, build.currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="rs-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Build your own with RigScout</p>
            <p className="text-sm text-[var(--muted)]">
              Track prices, compare retailers, and save complete builds.
            </p>
          </div>
          <Link to="/signup" className="rs-btn-primary shrink-0">
            Start free
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rs-card p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
