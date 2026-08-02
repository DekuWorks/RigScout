import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatMoney } from "@rigscout/shared";
import { Copy, Layers3, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/useAuth";
import { buildTotals, missingBuildCategories } from "@/lib/build-calculations";
import {
  createBuild,
  deleteBuild,
  duplicateBuild,
  listBuilds,
  updateBuild,
} from "@/lib/builds";

export function BuildsPage() {
  const { user, supabaseConfigured } = useAuth();
  const ownerId = user?.id ?? "guest";
  const useRemote = supabaseConfigured && Boolean(user);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const queryKey = ["builds", ownerId, useRemote];
  const builds = useQuery({
    queryKey,
    queryFn: () => listBuilds(ownerId, useRemote),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey });
  const create = useMutation({
    mutationFn: () => createBuild(ownerId, name.trim() || "New PC build", useRemote),
    onSuccess: (build) => {
      setName("");
      void refresh();
      navigate(`/app/builds/${build.id}`);
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteBuild(ownerId, id, useRemote),
    onSuccess: refresh,
  });
  const duplicate = useMutation({
    mutationFn: (id: string) => {
      const build = builds.data?.find((entry) => entry.id === id);
      if (!build) throw new Error("Build not found");
      return duplicateBuild(ownerId, build, useRemote);
    },
    onSuccess: refresh,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rs-accent">Build Lab</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Your PC builds</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Plan parts, track purchase prices, and catch common compatibility conflicts.
          </p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <input
            className="rs-input min-w-0 sm:w-64"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Build name"
            aria-label="New build name"
          />
          <button className="rs-btn-primary shrink-0" disabled={create.isPending}>
            <Plus className="h-4 w-4" /> Create
          </button>
        </form>
      </header>

      {!useRemote ? (
        <div className="rounded-xl border border-rs-accent/20 bg-rs-accent/5 px-4 py-3 text-sm">
          Demo mode: builds are stored in this browser.
        </div>
      ) : null}

      {builds.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((key) => <Skeleton key={key} className="h-52" />)}
        </div>
      ) : builds.isError ? (
        <ErrorState message="Builds could not be loaded." onRetry={() => void builds.refetch()} />
      ) : builds.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {builds.data.map((build) => {
            const totals = buildTotals(build);
            const missing = missingBuildCategories(build);
            const progress = Math.round(
              ((8 - Math.min(8, missing.length)) / 8) * 100,
            );
            return (
              <article key={build.id} className="rs-card rs-card-hover flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      to={`/app/builds/${build.id}`}
                      className="font-display text-lg font-semibold hover:text-rs-accent"
                    >
                      {build.name}
                    </Link>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {build.items.length} parts · {missing.length} core categories missing
                    </p>
                  </div>
                  <span className="rounded-full bg-rs-primary/10 px-2 py-1 text-xs text-rs-accent">
                    {progress}%
                  </span>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rs-accent to-rs-primary"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-5 font-display text-2xl font-bold">
                  {formatMoney(totals.current, build.currency)}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Target{" "}
                  {build.target_total_minor == null
                    ? "not set"
                    : formatMoney(build.target_total_minor, build.currency)}
                </p>
                <div className="mt-auto flex gap-2 pt-5">
                  <button
                    className="rs-btn-secondary flex-1"
                    onClick={() => {
                      const next = window.prompt("Rename build", build.name)?.trim();
                      if (next) {
                        void updateBuild(ownerId, build.id, { name: next }, useRemote).then(refresh);
                      }
                    }}
                  >
                    Rename
                  </button>
                  <button
                    className="rs-btn-secondary px-3"
                    aria-label={`Duplicate ${build.name}`}
                    onClick={() => duplicate.mutate(build.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    className="rs-btn-secondary px-3 text-rs-danger"
                    aria-label={`Delete ${build.name}`}
                    onClick={() => {
                      if (window.confirm(`Delete “${build.name}”?`)) remove.mutate(build.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Layers3 className="h-8 w-8" />}
          title="No builds yet"
          description="Name your first build above. It takes seconds, and you can change everything later."
        />
      )}
    </div>
  );
}
