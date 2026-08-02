import { useQuery } from "@tanstack/react-query";
import { formatMoney } from "@rigscout/shared";
import { motion } from "framer-motion";
import { Bell, Layers, PiggyBank, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { DealScoreBadge } from "@/components/catalog/DealScoreBadge";
import { apiFetch } from "@/lib/api";
import { fetchDeals } from "@/lib/catalog-api";
import { PriceChange } from "@/components/ui/PriceChange";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/useAuth";
import { buildTotals, missingBuildCategories } from "@/lib/build-calculations";
import { listBuilds } from "@/lib/builds";

type HealthResponse = {
  status: string;
  service: string;
  version: string;
};

const baseStats = [
  { label: "Saved this month", value: "$1,247", icon: PiggyBank, delta: -124700 },
  { label: "Price alerts", value: "14", icon: Bell },
  { label: "Deals found", value: "28", icon: Tag },
];

const heroModules = import.meta.glob<{ default: string }>("../assets/pc-hero.png", {
  eager: true,
});
const pcHeroUrl = heroModules["../assets/pc-hero.png"]?.default;

export function DashboardPage() {
  const { user, supabaseConfigured } = useAuth();
  const ownerId = user?.id ?? "guest";
  const useRemote = supabaseConfigured && Boolean(user);
  const health = useQuery({
    queryKey: ["api-health"],
    queryFn: () => apiFetch<HealthResponse>("/health"),
    retry: false,
  });

  const deals = useQuery({
    queryKey: ["deals-preview"],
    queryFn: () => fetchDeals(),
    retry: false,
  });
  const builds = useQuery({
    queryKey: ["builds", ownerId, useRemote],
    queryFn: () => listBuilds(ownerId, useRemote),
  });

  const topDeal = deals.data?.best_deal_scores[0];
  const stats = [
    ...baseStats,
    { label: "Builds", value: String(builds.data?.length ?? 0), icon: Layers },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="rs-card overflow-hidden">
        <div className="grid items-stretch gap-0 md:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center p-6 md:p-8">
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Track prices. Compare smarter.{" "}
              <span className="rs-gradient-text">Build better.</span>
            </h1>
            <p className="mt-3 max-w-lg text-[var(--muted)]">
              Scout parts across retailers, track full builds, and catch price drops before you buy.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/app/builds" className="rs-btn-primary">
                + New Build
              </Link>
              <Link to="/app/deals" className="rs-btn-secondary">
                Browse Deals
              </Link>
            </div>
            <p className="mt-4 text-xs text-[var(--muted)]">
              API{" "}
              {health.isLoading
                ? "…"
                : health.isError
                  ? "offline (local demo still works)"
                  : `${health.data?.status} · ${health.data?.service}`}
            </p>
          </div>
          <div className="relative flex min-h-52 items-end justify-center overflow-hidden md:min-h-72">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_60%_45%,rgba(0,194,255,0.18),transparent_55%)]"
              aria-hidden
            />
            {pcHeroUrl ? (
              <img
                src={`${pcHeroUrl}?v=cutout1`}
                alt="Custom gaming PC with cyan LED lighting"
                className="relative z-10 h-full w-full max-h-80 object-contain object-bottom drop-shadow-[0_24px_40px_rgba(0,0,0,0.5)]"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(0,194,255,0.28),transparent_50%),linear-gradient(145deg,rgba(13,110,253,0.18),transparent)]" />
            )}
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--card)] to-transparent"
              aria-hidden
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="rs-card rs-card-hover p-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--muted)]">{stat.label}</p>
              <stat.icon className="h-4 w-4 text-rs-accent" aria-hidden />
            </div>
            <p className="mt-2 font-display text-2xl font-bold">{stat.value}</p>
            {stat.delta != null ? <PriceChange className="mt-2" deltaMinor={stat.delta} percent={23} /> : null}
          </motion.div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rs-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">My Builds</h2>
            <Link to="/app/builds" className="text-sm text-rs-accent hover:underline">
              Open Build Lab
            </Link>
          </div>
          {builds.isLoading ? <Skeleton className="mt-4 h-28 w-full" /> : null}
          {builds.data?.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {builds.data.slice(0, 3).map((build) => {
                const missing = missingBuildCategories(build);
                return (
                  <Link
                    key={build.id}
                    to={`/app/builds/${build.id}`}
                    className="rounded-xl border border-[var(--card-border)] p-4 transition hover:border-rs-accent"
                  >
                    <p className="font-medium">{build.name}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {formatMoney(buildTotals(build).current, build.currency)} · {missing.length} missing
                    </p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rs-accent to-rs-primary"
                        style={{ width: `${((8 - missing.length) / 8) * 100}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : !builds.isLoading ? (
            <div className="mt-4 rounded-xl border border-dashed border-[var(--card-border)] p-5 text-sm text-[var(--muted)]">
              No builds yet. <Link className="text-rs-accent hover:underline" to="/app/builds">Create one in Build Lab.</Link>
            </div>
          ) : null}
        </div>

        <div className="rs-card p-5">
          <h2 className="font-display text-lg font-semibold">Top deal right now</h2>
          {deals.isLoading ? <Skeleton className="mt-4 h-24 w-full" /> : null}
          {topDeal ? (
            <>
              <p className="mt-4 font-medium">{topDeal.name}</p>
              <p className="text-sm text-[var(--muted)]">{topDeal.retailer} · MOCK</p>
              <p className="mt-2 font-display text-2xl font-bold">
                {formatMoney(topDeal.price_minor, topDeal.currency)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <DealScoreBadge score={topDeal.deal_score} compact />
                <PriceChange deltaMinor={topDeal.price_delta_minor} />
              </div>
              <Link to={`/app/discover/${topDeal.slug}`} className="rs-btn-primary mt-4 w-full">
                View Deal
              </Link>
            </>
          ) : (
            <p className="mt-4 text-sm text-[var(--muted)]">
              Start the API to load live mock deals.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
