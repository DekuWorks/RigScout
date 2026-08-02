import { BookOpen, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { learnGuideMeta, listLearnTags } from "@/content/learn";
import { EmptyState } from "@/components/ui/EmptyState";

export function LearnPage() {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string>("all");
  const tags = useMemo(() => listLearnTags(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return learnGuideMeta.filter((guide) => {
      const tagOk = tag === "all" || guide.tags.includes(tag);
      if (!tagOk) return false;
      if (!q) return true;
      return (
        guide.title.toLowerCase().includes(q) ||
        guide.summary.toLowerCase().includes(q) ||
        guide.tags.some((t) => t.includes(q))
      );
    });
  }, [query, tag]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rs-accent">Learn</p>
        <h1 className="font-display text-3xl font-bold">PC building guides</h1>
        <p className="max-w-2xl text-sm text-[var(--muted)] sm:text-base">
          Beginner-friendly explainers for parts, compatibility, power, and shopping smarter — written
          to pair with Discover, Build Lab, and Watchlist.
        </p>
      </header>

      <div className="rs-card flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm">
          <span className="mb-1.5 block text-[var(--muted)]">Search guides</span>
          <input
            type="search"
            className="rs-input"
            placeholder="CPU, PSU, prebuilts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </label>
        <label className="block text-sm sm:w-52">
          <span className="mb-1.5 block text-[var(--muted)]">Topic</span>
          <select
            className="rs-input"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            aria-label="Filter guides by topic"
          >
            <option value="all">All topics</option>
            {tags.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-8 w-8" aria-hidden />}
          title="No guides match"
          description="Try another search term or clear the topic filter."
          action={
            <button
              type="button"
              className="rs-btn-secondary"
              onClick={() => {
                setQuery("");
                setTag("all");
              }}
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((guide) => (
            <li key={guide.slug}>
              <Link
                to={`/app/learn/${guide.slug}`}
                className="rs-card rs-card-hover flex h-full flex-col p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rs-accent"
              >
                <div className="flex flex-wrap gap-2">
                  {guide.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-rs-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rs-accent"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <h2 className="mt-3 font-display text-lg font-semibold leading-snug">{guide.title}</h2>
                <p className="mt-2 flex-1 text-sm text-[var(--muted)]">{guide.summary}</p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  {guide.readingMinutes} min read
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
