import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { isSupabaseReady } from "@/lib/supabase";

export function LoginPage() {
  const ready = isSupabaseReady();

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Logo className="mb-8 justify-center" />
      <div className="rs-card p-6">
        <h1 className="font-display text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Sign in to sync builds, watchlists, and alerts.
        </p>

        {!ready ? (
          <p className="mt-4 rounded-xl border border-rs-warning/40 bg-rs-warning/10 px-3 py-2 text-sm text-rs-warning">
            Auth requires Supabase credentials. Set <code>VITE_SUPABASE_URL</code> and{" "}
            <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env</code>. Phase 2 wires full auth.
          </p>
        ) : null}

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Email</span>
            <input type="email" required className="rs-input" autoComplete="email" />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Password</span>
            <input
              type="password"
              required
              className="rs-input"
              autoComplete="current-password"
            />
          </label>
          <button type="submit" className="rs-btn-primary w-full" disabled={!ready}>
            Log in
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          No account?{" "}
          <Link to="/signup" className="text-rs-accent hover:underline">
            Sign up
          </Link>
        </p>
        <p className="mt-2 text-center text-sm">
          <Link to="/app" className="text-[var(--muted)] hover:text-[var(--fg)]">
            Continue to dashboard (demo)
          </Link>
        </p>
      </div>
    </div>
  );
}
