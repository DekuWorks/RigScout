import { PLAN_LIMITS } from "@rigscout/shared";
import { useThemeStore } from "@/stores/theme";

export function SettingsPage() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Account & Settings</h1>
        <p className="mt-1 text-[var(--muted)]">
          Profile, preferences, and privacy controls expand in later phases.
        </p>
      </div>

      <section className="rs-card space-y-4 p-6">
        <h2 className="font-display text-lg font-semibold">Theme</h2>
        <div className="flex gap-2">
          {(["dark", "light"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={
                theme === value
                  ? "rs-btn-primary capitalize"
                  : "rs-btn-secondary capitalize"
              }
            >
              {value}
            </button>
          ))}
        </div>
      </section>

      <section className="rs-card space-y-3 p-6">
        <h2 className="font-display text-lg font-semibold">Plan entitlements</h2>
        <p className="text-sm text-[var(--muted)]">
          Feature boundaries for future Stripe integration (billing not activated).
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--card-border)] p-4 text-sm">
            <p className="font-semibold">Free</p>
            <ul className="mt-2 space-y-1 text-[var(--muted)]">
              <li>{PLAN_LIMITS.free.maxBuilds} builds</li>
              <li>{PLAN_LIMITS.free.maxWatchedProducts} watched products</li>
              <li>{PLAN_LIMITS.free.priceHistoryDays}-day history</li>
            </ul>
          </div>
          <div className="rounded-xl border border-rs-primary/40 p-4 text-sm">
            <p className="font-semibold">Scout Pro</p>
            <ul className="mt-2 space-y-1 text-[var(--muted)]">
              <li>{PLAN_LIMITS.scout_pro.maxBuilds} builds</li>
              <li>{PLAN_LIMITS.scout_pro.maxWatchedProducts} watched products</li>
              <li>{PLAN_LIMITS.scout_pro.priceHistoryDays}-day history</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
