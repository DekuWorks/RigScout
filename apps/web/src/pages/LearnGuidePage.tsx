import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getLearnGuideMeta, learnGuideMeta, loadLearnGuide } from "@/content/learn";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { SimpleMarkdown } from "@/lib/simple-markdown";

export function LearnGuidePage() {
  const { slug = "" } = useParams();
  const meta = getLearnGuideMeta(slug);

  const guideQuery = useQuery({
    queryKey: ["learn-guide", slug],
    queryFn: () => loadLearnGuide(slug),
    enabled: Boolean(meta),
    staleTime: Infinity,
  });

  if (!meta) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title="Guide not found"
          description="That Learn article does not exist or the link is outdated."
          action={
            <Link to="/app/learn" className="rs-btn-primary">
              Back to Learn
            </Link>
          }
        />
      </div>
    );
  }

  if (guideQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4" aria-busy="true" aria-label="Loading guide">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (guideQuery.isError || !guideQuery.data) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState
          title="Could not load guide"
          message="The article failed to load. Check your connection and try again."
          onRetry={() => void guideQuery.refetch()}
        />
      </div>
    );
  }

  const guide = guideQuery.data;
  const index = learnGuideMeta.findIndex((item) => item.slug === guide.slug);
  const prev = index > 0 ? learnGuideMeta[index - 1] : null;
  const next = index >= 0 && index < learnGuideMeta.length - 1 ? learnGuideMeta[index + 1] : null;

  return (
    <article className="mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="mb-4">
        <Link
          to="/app/learn"
          className="inline-flex items-center gap-1.5 text-sm text-rs-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          All guides
        </Link>
      </nav>

      <header className="space-y-3 border-b border-[var(--card-border)] pb-6">
        <div className="flex flex-wrap gap-2">
          {guide.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-rs-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rs-accent"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{guide.title}</h1>
        <p className="text-sm text-[var(--muted)] sm:text-base">{guide.summary}</p>
        <p className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {guide.readingMinutes} min read
        </p>
      </header>

      <div className="rs-md py-6">
        <SimpleMarkdown source={guide.body.replace(/^#\s.+\n+/, "")} />
      </div>

      <footer className="mt-4 grid gap-3 border-t border-[var(--card-border)] pt-6 sm:grid-cols-2">
        {prev ? (
          <Link
            to={`/app/learn/${prev.slug}`}
            className="rs-card rs-card-hover flex items-start gap-2 p-4"
          >
            <ArrowLeft className="mt-1 h-4 w-4 shrink-0 text-rs-accent" aria-hidden />
            <span>
              <span className="block text-xs text-[var(--muted)]">Previous</span>
              <span className="font-medium">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            to={`/app/learn/${next.slug}`}
            className="rs-card rs-card-hover flex items-start justify-end gap-2 p-4 text-right"
          >
            <span>
              <span className="block text-xs text-[var(--muted)]">Next</span>
              <span className="font-medium">{next.title}</span>
            </span>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-rs-accent" aria-hidden />
          </Link>
        ) : null}
      </footer>
    </article>
  );
}
