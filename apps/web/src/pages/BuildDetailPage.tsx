import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatMoney } from "@rigscout/shared";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Info,
  Link2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PriceChange } from "@/components/ui/PriceChange";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/useAuth";
import { evaluateBuild } from "@/lib/build-api";
import {
  buildCsv,
  buildTotals,
  itemCurrentPrice,
  missingBuildCategories,
} from "@/lib/build-calculations";
import {
  addBuildItem,
  deleteBuild,
  getBuild,
  removeBuildItem,
  updateBuild,
  updateBuildItem,
} from "@/lib/builds";
import { fetchProduct, searchProducts } from "@/lib/catalog-api";
import { REQUIRED_BUILD_CATEGORIES, type BuildProduct } from "@/types/builds";

function download(name: string, value: string, type: string) {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function BuildDetailPage() {
  const { buildId = "" } = useParams();
  const { user, supabaseConfigured } = useAuth();
  const ownerId = user?.id ?? "guest";
  const useRemote = supabaseConfigured && Boolean(user);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [pickerCategory, setPickerCategory] = useState<string | null>(null);
  const queryKey = ["build", ownerId, buildId, useRemote];
  const buildQuery = useQuery({
    queryKey,
    queryFn: () => getBuild(ownerId, buildId, useRemote),
  });
  const build = buildQuery.data;
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey });
    await queryClient.invalidateQueries({ queryKey: ["builds", ownerId, useRemote] });
  };
  const products = useQuery({
    queryKey: ["build-picker", pickerCategory],
    queryFn: () => searchProducts({ category: pickerCategory ?? undefined, page_size: 50 }),
    enabled: Boolean(pickerCategory),
  });
  const addProduct = useMutation({
    mutationFn: async (slug: string) => {
      const detail = await fetchProduct(slug);
      const product: BuildProduct = {
        ...detail.product,
        specs: detail.product.specs,
        listings: detail.listings,
      };
      await addBuildItem(ownerId, buildId, product, useRemote);
    },
    onSuccess: () => {
      setPickerCategory(null);
      void refresh();
    },
  });
  const compatibility = useQuery({
    queryKey: ["compatibility", build],
    queryFn: () => evaluateBuild(build!),
    enabled: Boolean(build?.items.length),
    retry: false,
  });

  if (buildQuery.isLoading) return <Skeleton className="mx-auto h-[640px] max-w-6xl" />;
  if (buildQuery.isError) {
    return <ErrorState message="This build could not be loaded." onRetry={() => void buildQuery.refetch()} />;
  }
  if (!build) {
    return (
      <ErrorState
        title="Build not found"
        message="It may have been deleted or belongs to another account."
      />
    );
  }

  const totals = buildTotals(build);
  const missing = missingBuildCategories(build);
  const slug = build.share_slug ?? `${build.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${build.id.slice(0, 6)}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link to="/app/builds" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-rs-accent">
            <ArrowLeft className="h-4 w-4" /> All builds
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold">{build.name}</h1>
            <button
              className="text-xs text-rs-accent hover:underline"
              onClick={() => {
                const next = window.prompt("Rename build", build.name)?.trim();
                if (next) void updateBuild(ownerId, build.id, { name: next }, useRemote).then(refresh);
              }}
            >
              Rename
            </button>
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Compatibility checks are guidance, not a guarantee. Confirm dimensions and firmware with manufacturers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rs-btn-secondary"
            onClick={() => download(`${slug}.json`, JSON.stringify(build, null, 2), "application/json")}
          >
            <Download className="h-4 w-4" /> JSON
          </button>
          <button
            className="rs-btn-secondary"
            onClick={() => download(`${slug}.csv`, buildCsv(build), "text/csv")}
          >
            <Download className="h-4 w-4" /> CSV
          </button>
          <button
            className="rs-btn-primary"
            onClick={async () => {
              await updateBuild(ownerId, build.id, { is_public: true, share_slug: slug }, useRemote);
              await navigator.clipboard.writeText(`${window.location.origin}/share/${slug}`);
              void refresh();
            }}
          >
            <Link2 className="h-4 w-4" /> Copy share link
          </button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Current total" value={formatMoney(totals.current, build.currency)} />
        <Metric
          label="Target"
          value={
            <input
              className="rs-input mt-1 py-1.5"
              type="number"
              min="0"
              step="1"
              defaultValue={build.target_total_minor == null ? "" : build.target_total_minor / 100}
              placeholder="Set target"
              onBlur={(event) => {
                const value = event.target.value ? Math.round(Number(event.target.value) * 100) : null;
                void updateBuild(ownerId, build.id, { target_total_minor: value }, useRemote).then(refresh);
              }}
            />
          }
        />
        <Metric label="Paid so far" value={formatMoney(totals.paid, build.currency)} />
        <Metric
          label="Saved on purchased"
          value={formatMoney(totals.saved, build.currency)}
          accent
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Components</h2>
            <span className="text-sm text-[var(--muted)]">{build.items.length} selected</span>
          </div>
          <div className="grid gap-3">
            {REQUIRED_BUILD_CATEGORIES.map((category) => {
              const item = build.items.find((entry) => entry.category === category);
              return (
                <article key={category} className="rs-card p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="w-28 shrink-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-rs-accent">
                        {category}
                      </p>
                    </div>
                    {item ? (
                      <>
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/app/discover/${item.product.slug}`}
                            className="font-medium hover:text-rs-accent"
                          >
                            {item.product.name}
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                            <span>{formatMoney(itemCurrentPrice(item), build.currency)}</span>
                            <PriceChange deltaMinor={item.product.price_delta_minor} />
                          </div>
                        </div>
                        <select
                          className="rs-input md:w-48"
                          value={item.listing_id ?? ""}
                          onChange={(event) =>
                            void updateBuildItem(
                              ownerId,
                              build.id,
                              item.id,
                              {
                                listing_id: event.target.value || null,
                                purchased: item.purchased,
                                paid_price_minor: item.paid_price_minor,
                              },
                              useRemote,
                            ).then(refresh)
                          }
                          aria-label={`Preferred listing for ${item.product.name}`}
                        >
                          {(item.product.listings ?? []).map((listing) => (
                            <option key={listing.id} value={listing.id}>
                              {listing.retailer} · {formatMoney(listing.price_minor + listing.shipping_minor, listing.currency)}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={item.purchased}
                            onChange={(event) =>
                              void updateBuildItem(
                                ownerId,
                                build.id,
                                item.id,
                                {
                                  listing_id: item.listing_id,
                                  purchased: event.target.checked,
                                  paid_price_minor: item.paid_price_minor,
                                },
                                useRemote,
                              ).then(refresh)
                            }
                          />
                          Purchased
                        </label>
                        {item.purchased ? (
                          <input
                            className="rs-input md:w-28"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={
                              item.paid_price_minor == null ? "" : item.paid_price_minor / 100
                            }
                            placeholder="Paid $"
                            aria-label={`Paid price for ${item.product.name}`}
                            onBlur={(event) =>
                              void updateBuildItem(
                                ownerId,
                                build.id,
                                item.id,
                                {
                                  listing_id: item.listing_id,
                                  purchased: item.purchased,
                                  paid_price_minor: event.target.value
                                    ? Math.round(Number(event.target.value) * 100)
                                    : null,
                                },
                                useRemote,
                              ).then(refresh)
                            }
                          />
                        ) : null}
                        <button
                          className="rounded-lg p-2 text-[var(--muted)] hover:bg-rs-danger/10 hover:text-rs-danger"
                          aria-label={`Remove ${item.product.name}`}
                          onClick={() =>
                            void removeBuildItem(ownerId, build.id, item.id, useRemote).then(refresh)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="flex-1 text-sm text-[var(--muted)]">No {category} selected</p>
                        <button className="rs-btn-secondary" onClick={() => setPickerCategory(category)}>
                          <Plus className="h-4 w-4" /> Add part
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rs-card p-5">
            <h2 className="font-display font-semibold">Compatibility guidance</h2>
            {compatibility.isLoading ? <Skeleton className="mt-4 h-28" /> : null}
            {compatibility.isError ? (
              <p className="mt-3 text-sm text-rs-warning">Start the API to run compatibility checks.</p>
            ) : null}
            <div className="mt-4 space-y-3">
              {compatibility.data?.messages.map((message) => (
                <div key={message.code} className="flex gap-2 text-sm">
                  {message.severity === "error" || message.severity === "warning" ? (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rs-warning" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-rs-success" />
                  )}
                  <span>{message.message}</span>
                </div>
              ))}
              {!build.items.length ? (
                <div className="flex gap-2 text-sm text-[var(--muted)]">
                  <Info className="h-4 w-4 shrink-0" /> Add parts to begin checks.
                </div>
              ) : null}
            </div>
            {compatibility.data?.totals.recommended_psu_watts ? (
              <p className="mt-4 border-t border-[var(--card-border)] pt-4 text-xs text-[var(--muted)]">
                Known TDP {compatibility.data.totals.known_tdp_watts} W · PSU guidance{" "}
                {compatibility.data.totals.recommended_psu_watts} W
              </p>
            ) : null}
          </section>
          <section className="rs-card p-5">
            <h2 className="font-display font-semibold">Missing categories</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {missing.length ? missing.map((category) => (
                <button
                  key={category}
                  className="rounded-full border border-[var(--card-border)] px-3 py-1.5 text-xs hover:border-rs-accent"
                  onClick={() => setPickerCategory(category)}
                >
                  + {category}
                </button>
              )) : <span className="text-sm text-rs-success">Core build complete</span>}
            </div>
          </section>
          <button
            className="w-full text-sm text-rs-danger hover:underline"
            onClick={async () => {
              if (!window.confirm(`Delete “${build.name}”?`)) return;
              await deleteBuild(ownerId, build.id, useRemote);
              navigate("/app/builds");
            }}
          >
            Delete build
          </button>
        </aside>
      </div>

      {pickerCategory ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="rs-card max-h-[80vh] w-full max-w-2xl overflow-y-auto bg-[var(--card)] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-rs-accent">Add {pickerCategory}</p>
                <h2 className="font-display text-xl font-semibold">Choose a catalogue part</h2>
              </div>
              <button className="rounded-lg p-2" onClick={() => setPickerCategory(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {products.isLoading ? <Skeleton className="mt-5 h-56" /> : null}
            {products.isError ? <ErrorState message="Catalogue products could not be loaded." /> : null}
            <div className="mt-5 grid gap-3">
              {products.data?.items.map((product) => (
                <button
                  key={product.id}
                  className="rounded-xl border border-[var(--card-border)] p-4 text-left transition hover:border-rs-accent"
                  disabled={addProduct.isPending}
                  onClick={() => addProduct.mutate(product.slug)}
                >
                  <span className="font-medium">{product.name}</span>
                  <span className="mt-1 flex items-center justify-between text-sm text-[var(--muted)]">
                    <span>{product.best_retailer}</span>
                    <span>{formatMoney(product.best_price_minor + product.best_shipping_minor, product.currency)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rs-card p-5">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      {typeof value === "string" ? (
        <p className={`mt-2 font-display text-2xl font-bold ${accent ? "text-rs-success" : ""}`}>
          {value}
        </p>
      ) : value}
    </div>
  );
}
