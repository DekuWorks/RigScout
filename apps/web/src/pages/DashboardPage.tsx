import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, Layers, PiggyBank, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { PriceChange } from "@/components/ui/PriceChange";
import { Skeleton } from "@/components/ui/Skeleton";

type HealthResponse = {
  status: string;
  service: string;
  version: string;
};

const stats = [
  { label: "Saved this month", value: "$1,247", icon: PiggyBank, delta: -124700 },
  { label: "Price alerts", value: "14", icon: Bell },
  { label: "Deals found", value: "28", icon: Tag },
  { label: "Builds", value: "4", icon: Layers },
];

export function DashboardPage() {
  const health = useQuery({
    queryKey: ["api-health"],
    queryFn: () => apiFetch<HealthResponse>("/health"),
    retry: false,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="rs-card overflow-hidden">
        <div className="grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-8">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Track prices. Compare smarter.{" "}
              <span className="rs-gradient-text">Build better.</span>
            </h1>
            <p className="mt-3 max-w-lg text-[var(--muted)]">
              Your RigScout overview — demo metrics until Phase 2–3 connect live data.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/app/builds" className="rs-btn-primary">
                + New Build
              </Link>
              <Link to="/app/deals" className="rs-btn-secondary">
                Browse Deals
              </Link>
            </div>
          </div>
          <div className="rs-card border-rs-primary/20 bg-rs-primary/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-rs-accent">
              API status
            </p>
            {health.isLoading ? (
              <Skeleton className="mt-3 h-10 w-full" />
            ) : health.isError ? (
              <p className="mt-3 text-sm text-[var(--muted)]">
                API offline — start with <code className="text-rs-accent">npm run dev:api</code>
              </p>
            ) : (
              <p className="mt-3 text-sm">
                <span className="font-semibold text-rs-success">{health.data?.status}</span>
                {" · "}
                {health.data?.service} v{health.data?.version}
              </p>
            )}
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
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {["Dream Build 2025", "Streaming Setup", "Mini ITX Beast"].map((name) => (
              <div key={name} className="rounded-xl border border-[var(--card-border)] p-4">
                <p className="font-medium">{name}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">Demo placeholder</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-rs-accent to-rs-primary" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rs-card p-5">
          <h2 className="font-display text-lg font-semibold">Top deal right now</h2>
          <p className="mt-4 font-medium">AMD Ryzen 7 7800X3D</p>
          <p className="text-sm text-[var(--muted)]">Demo · Amazon placeholder</p>
          <p className="mt-2 font-display text-2xl font-bold">$359.99</p>
          <PriceChange deltaMinor={-8000} percent={18} />
          <Link to="/app/deals" className="rs-btn-primary mt-4 w-full">
            View Deal
          </Link>
        </div>
      </section>
    </div>
  );
}
