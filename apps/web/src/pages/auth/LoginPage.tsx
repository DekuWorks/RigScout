import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/features/auth/useAuth";

export function LoginPage() {
  const { signIn, signInWithGoogle, supabaseConfigured, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Logo className="mb-8 justify-center" />
      <div className="rs-card p-6">
        <h1 className="font-display text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Sign in to sync builds, watchlists, and alerts.
        </p>

        {!supabaseConfigured ? (
          <p className="mt-4 rounded-xl border border-rs-warning/40 bg-rs-warning/10 px-3 py-2 text-sm text-rs-warning">
            Auth requires Supabase credentials. Set <code>VITE_SUPABASE_URL</code> and{" "}
            <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env</code>, then apply migrations.
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="mt-4 rounded-xl border border-rs-danger/40 bg-rs-danger/10 px-3 py-2 text-sm text-rs-danger">
            {error}
          </p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Email</span>
            <input
              type="email"
              required
              className="rs-input"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Password</span>
            <input
              type="password"
              required
              minLength={8}
              className="rs-input"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-rs-accent hover:underline">
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            className="rs-btn-primary w-full"
            disabled={!supabaseConfigured || submitting}
          >
            {submitting ? "Signing in…" : "Log in"}
          </button>
        </form>

        <button
          type="button"
          className="rs-btn-secondary mt-3 w-full"
          disabled={!supabaseConfigured || submitting}
          onClick={() => {
            void signInWithGoogle().catch((err: unknown) => {
              setError(err instanceof Error ? err.message : "Google sign-in failed");
            });
          }}
        >
          Continue with Google
        </button>
        <p className="mt-2 text-center text-[11px] text-[var(--muted)]">
          Google SSO uses Supabase Auth. If redirect fails, confirm the callback URL is listed in
          Google Cloud OAuth credentials.
        </p>

        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          No account?{" "}
          <Link to="/signup" className="text-rs-accent hover:underline">
            Sign up
          </Link>
        </p>
        {!supabaseConfigured ? (
          <p className="mt-2 text-center text-sm">
            <Link to="/app" className="text-[var(--muted)] hover:text-[var(--fg)]">
              Continue to dashboard (demo)
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
