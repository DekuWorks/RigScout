import { formatMoney } from "@rigscout/shared";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PricePoint } from "@/types/catalog";

type PriceHistoryChartProps = {
  points: PricePoint[];
  currency?: string;
};

export function PriceHistoryChart({ points, currency = "USD" }: PriceHistoryChartProps) {
  const data = points.map((point) => ({
    date: new Date(point.recorded_at).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    price: point.price_minor / 100,
    raw: point.price_minor,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[var(--muted)]">
        No price history available yet.
      </div>
    );
  }

  return (
    <div className="h-72 w-full" role="img" aria-label="Price history chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="color-mix(in srgb, var(--muted) 25%, transparent)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            minTickGap={24}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={(value: number) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--card-border)",
              borderRadius: 12,
              color: "var(--fg)",
            }}
            formatter={(value) => [
              formatMoney(Math.round(Number(value) * 100), currency),
              "Price",
            ]}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#00C2FF"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: "#0D6EFD" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
