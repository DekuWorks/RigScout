import { dealScoreLabel } from "@rigscout/shared";

type DealScoreBadgeProps = {
  score: number | null;
  compact?: boolean;
};

export function DealScoreBadge({ score, compact = false }: DealScoreBadgeProps) {
  if (score === null) {
    return (
      <span
        className="inline-flex items-center rounded-lg border border-[var(--card-border)] px-2 py-1 text-xs text-[var(--muted)]"
        title="Not enough price history for a reliable score"
      >
        {compact ? "N/A" : "Insufficient history"}
      </span>
    );
  }

  const tone =
    score >= 80
      ? "border-rs-success/40 bg-rs-success/10 text-rs-success"
      : score >= 65
        ? "border-rs-accent/40 bg-rs-accent/10 text-rs-accent"
        : score >= 45
          ? "border-rs-warning/40 bg-rs-warning/10 text-rs-warning"
          : "border-rs-danger/40 bg-rs-danger/10 text-rs-danger";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-semibold ${tone}`}
      title={dealScoreLabel(score)}
    >
      <span aria-hidden>{Math.round(score)}</span>
      {!compact ? <span className="font-medium opacity-90">{dealScoreLabel(score)}</span> : null}
    </span>
  );
}
