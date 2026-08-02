import { useEffect, useState, type FormEvent } from "react";
import { PLAN_LIMITS } from "@rigscout/shared";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { useThemeStore } from "@/stores/theme";

export function SettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const { user, profile, updateProfile, signOut, supabaseConfigured } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [currency, setCurrency] = useState(profile?.currency ?? "USD");
  const [region, setRegion] = useState(profile?.region ?? "US");
  const [notifyInApp, setNotifyInApp] = useState(profile?.notify_in_app ?? true);
  const [notifyEmail, setNotifyEmail] = useState(profile?.notify_email ?? true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
    setCurrency(profile?.currency ?? "USD");
    setRegion(profile?.region ?? "US");
    setNotifyInApp(profile?.notify_in_app ?? true);
    setNotifyEmail(profile?.notify_email ?? true);
  }, [profile]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setSaving(true);
    try {
      await updateProfile({
        display_name: displayName,
        currency,
        region,
        notify_in_app: notifyInApp,
        notify_email: notifyEmail,
        theme,
      });
      setMessage("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Account & Settings</h1>
        <p className="mt-1 text-[var(--muted)]">
          Manage profile, theme, notifications, and privacy preferences.
        </p>
      </div>

      {!supabaseConfigured ? (
        <div className="rs-card border-rs-warning/40 bg-rs-warning/5 p-4 text-sm text-rs-warning">
          Running in demo mode without Supabase. Profile persistence activates when credentials
          are configured.{" "}
          <Link to="/login" className="underline">
            Auth pages
          </Link>
        </div>
      ) : null}

      <section className="rs-card space-y-4 p-6">
        <h2 className="font-display text-lg font-semibold">Theme</h2>
        <div className="flex gap-2">
          {(["dark", "light"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={theme === value ? "rs-btn-primary capitalize" : "rs-btn-secondary capitalize"}
            >
              {value}
            </button>
          ))}
        </div>
      </section>

      <section className="rs-card space-y-4 p-6">
        <h2 className="font-display text-lg font-semibold">Profile</h2>
        <p className="text-sm text-[var(--muted)]">
          Signed in as {user?.email ?? "guest (demo)"}
        </p>
        <form className="space-y-4" onSubmit={onSave}>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Display name</span>
            <input
              className="rs-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={!user}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Currency</span>
              <select
                className="rs-input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={!user}
              >
                <option value="USD">USD</option>
                <option value="CAD">CAD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Default region</span>
              <select
                className="rs-input"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                disabled={!user}
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="EU">Europe</option>
                <option value="UK">United Kingdom</option>
              </select>
            </label>
          </div>
          <fieldset className="space-y-2 text-sm">
            <legend className="mb-1 font-medium">Notifications</legend>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notifyInApp}
                onChange={(e) => setNotifyInApp(e.target.checked)}
                disabled={!user}
              />
              In-app alerts
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                disabled={!user}
              />
              Email alerts (delivery in Phase 5)
            </label>
          </fieldset>

          {error ? (
            <p role="alert" className="text-sm text-rs-danger">
              {error}
            </p>
          ) : null}
          {message ? (
            <p role="status" className="text-sm text-rs-success">
              {message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button type="submit" className="rs-btn-primary" disabled={!user || saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
            {user ? (
              <button type="button" className="rs-btn-secondary" onClick={() => void signOut()}>
                Sign out
              </button>
            ) : (
              <Link to="/login" className="rs-btn-secondary">
                Sign in
              </Link>
            )}
          </div>
        </form>
      </section>

      <section className="rs-card space-y-3 p-6">
        <h2 className="font-display text-lg font-semibold">Plan entitlements</h2>
        <p className="text-sm text-[var(--muted)]">
          Feature boundaries for future Stripe integration (billing not activated). Current tier:{" "}
          <strong>{profile?.plan_tier ?? "free"}</strong>
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

      <section className="rs-card space-y-3 border-rs-danger/30 p-6">
        <h2 className="font-display text-lg font-semibold text-rs-danger">Danger zone</h2>
        <p className="text-sm text-[var(--muted)]">
          Account deletion and data export land with privacy controls in a later polish pass.
          Contact support or use Supabase dashboard for manual deletion until then.
        </p>
      </section>
    </div>
  );
}
