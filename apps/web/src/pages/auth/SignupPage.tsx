import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/features/auth/useAuth";

export function SignupPage() {
  const { signUp, signInWithGoogle, supabaseConfigured, user, loading } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/app" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await signUp({ email, password, displayName });
      setSuccess(
        "Account created. Check your email to verify your address if confirmation is enabled, then log in.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Logo className="mb-8 justify-center" />
      <div className="rs-card p-6">
        <h1 className="font-display text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Start tracking parts and building smarter.
        </p>

        {!supabaseConfigured ? (
          <p className="mt-4 rounded-xl border border-rs-warning/40 bg-rs-warning/10 px-3 py-2 text-sm text-rs-warning">
            Sign-up requires Supabase Auth credentials in <code>.env</code>.
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="mt-4 rounded-xl border border-rs-danger/40 bg-rs-danger/10 px-3 py-2 text-sm text-rs-danger">
            {error}
          </p>
        ) : null}
        {success ? (
          <p role="status" className="mt-4 rounded-xl border border-rs-success/40 bg-rs-success/10 px-3 py-2 text-sm text-rs-success">
            {success}
          </p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Display name</span>
            <input
              type="text"
              required
              className="rs-input"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="rs-btn-primary w-full"
            disabled={!supabaseConfigured || submitting}
          >
            {submitting ? "Creating…" : "Sign up"}
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

        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link to="/login" className="text-rs-accent hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
