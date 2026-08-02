import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatMoney } from "@rigscout/shared";
import { Bell, BellOff, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/useAuth";
import { deleteAlert, listAlerts, setAlertActive } from "@/lib/alerts";
import { listWatchlists, removeFromWatchlist } from "@/lib/watchlists";

export function WatchlistPage() {
  const { user, profile, supabaseConfigured } = useAuth();
  const ownerId = user?.id ?? "guest";
  const useRemote = supabaseConfigured && Boolean(user);
  const queryClient = useQueryClient();
  const watchKey = ["watchlists", ownerId, useRemote];
  const alertKey = ["alerts", ownerId, useRemote];

  const watchlists = useQuery({
    queryKey: watchKey,
    queryFn: () => listWatchlists(ownerId, useRemote),
  });
  const alerts = useQuery({
    queryKey: alertKey,
    queryFn: () => listAlerts(ownerId, useRemote),
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: watchKey });
    await queryClient.invalidateQueries({ queryKey: alertKey });
  };

  const removeWatch = useMutation({
    mutationFn: (id: string) => removeFromWatchlist(ownerId, id, useRemote),
    onSuccess: () => void refresh(),
  });
  const toggleAlert = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setAlertActive(ownerId, id, active, useRemote),
    onSuccess: () => void refresh(),
  });
  const removeAlert = useMutation({
    mutationFn: (id: string) => deleteAlert(ownerId, id, useRemote),
    onSuccess: () => void refresh(),
  });

  if (watchlists.isLoading || alerts.isLoading) {
    return <Skeleton className="mx-auto h-96 max-w-6xl" />;
  }
  if (watchlists.isError || alerts.isError) {
    return (
      <ErrorState
        message="Watchlist data could not be loaded."
        onRetry={() => {
          void watchlists.refetch();
          void alerts.refetch();
        }}
      />
    );
  }

  const items = watchlists.data ?? [];
  const alertRows = alerts.data ?? [];
  const plan = profile?.plan_tier ?? "free";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rs-accent">
          Watchlist & Alerts
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">Tracked parts</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Save products and set target prices. In-app notifications update when the evaluate job
          runs{supabaseConfigured ? "" : " (guest mode stores data locally)"}.
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Plan: {plan === "scout_pro" ? "Scout Pro" : "Free"} · {items.length} watched
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Watchlist</h2>
        {items.length === 0 ? (
          <EmptyState
            title="No watched products"
            description="Open a product and use Set price alert — it adds the part to your watchlist."
            action={
              <Link to="/app/discover" className="rs-btn-primary">
                Browse Discover
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {items.map((entry) => {
              const productAlerts = alertRows.filter((a) => a.product_id === entry.product_id);
              return (
                <li key={entry.id} className="rs-card flex flex-wrap items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/app/discover/${entry.product?.slug ?? ""}`}
                      className="font-semibold hover:text-rs-accent"
                    >
                      {entry.product?.name ?? "Product"}
                    </Link>
                    <p className="text-sm text-[var(--muted)]">
                      {entry.product?.brand} · {entry.product?.category}
                    </p>
                    {productAlerts.length ? (
                      <p className="mt-1 text-xs text-rs-accent">
                        {productAlerts
                          .map((alert) => {
                            const bits: string[] = [];
                            if (alert.target_price_minor != null) {
                              bits.push(`≤ ${formatMoney(alert.target_price_minor)}`);
                            }
                            if (alert.percent_drop != null) {
                              bits.push(`${alert.percent_drop}% drop`);
                            }
                            return `${bits.join(" · ")}${alert.is_active ? "" : " (paused)"}`;
                          })
                          .join("; ")}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-[var(--muted)]">No active alert rules</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="rs-btn-secondary"
                    onClick={() => removeWatch.mutate(entry.id)}
                    aria-label="Remove from watchlist"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Alert rules</h2>
        {alertRows.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No alert rules yet. Set one from a product page.
          </p>
        ) : (
          <ul className="space-y-3">
            {alertRows.map((alert) => (
              <li key={alert.id} className="rs-card flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{alert.product?.name ?? "Product alert"}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {alert.target_price_minor != null
                      ? `Target ${formatMoney(alert.target_price_minor)}`
                      : null}
                    {alert.target_price_minor != null && alert.percent_drop != null ? " · " : null}
                    {alert.percent_drop != null ? `${alert.percent_drop}% drop` : null}
                    {" · "}
                    {[alert.channel_in_app ? "In-app" : null, alert.channel_email ? "Email" : null]
                      .filter(Boolean)
                      .join(" + ") || "No channels"}
                  </p>
                </div>
                <button
                  type="button"
                  className="rs-btn-secondary"
                  onClick={() =>
                    toggleAlert.mutate({ id: alert.id, active: !alert.is_active })
                  }
                >
                  {alert.is_active ? (
                    <>
                      <BellOff className="h-4 w-4" /> Pause
                    </>
                  ) : (
                    <>
                      <Bell className="h-4 w-4" /> Resume
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="rs-btn-secondary"
                  onClick={() => removeAlert.mutate(alert.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
