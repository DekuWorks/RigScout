import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

type PriceChangeProps = {
  /** Change in minor units; negative = price drop (good for buyers). */
  deltaMinor: number;
  percent?: number | null;
  className?: string;
};

export function PriceChange({ deltaMinor, percent, className = "" }: PriceChangeProps) {
  if (deltaMinor === 0) {
    return (
      <span className={`inline-flex items-center gap-1 text-sm text-[var(--muted)] ${className}`}>
        <Minus className="h-3.5 w-3.5" aria-hidden />
        No change
      </span>
    );
  }

  const isDrop = deltaMinor < 0;
  const Icon = isDrop ? ArrowDownRight : ArrowUpRight;
  const abs = Math.abs(deltaMinor) / 100;
  const label = `$${abs.toFixed(2)}${percent != null ? ` (${Math.abs(percent).toFixed(1)}%)` : ""}`;

  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-medium ${isDrop ? "price-down" : "price-up"} ${className}`}
      aria-label={isDrop ? `Price down ${label}` : `Price up ${label}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}
