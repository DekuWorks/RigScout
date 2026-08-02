import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/features/auth/useAuth";

export function ForgotPasswordPage() {
  const { resetPassword, supabaseConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await resetPassword(email);
      setSuccess("If an account exists for that email, a reset link is on the way.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Logo className="mb-8 justify-center" />
      <div className="rs-card p-6">
        <h1 className="font-display text-2xl font-bold">Reset password</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          We&apos;ll email a secure link to choose a new password.
        </p>

        {!supabaseConfigured ? (
          <p className="mt-4 rounded-xl border border-rs-warning/40 bg-rs-warning/10 px-3 py-2 text-sm text-rs-warning">
            Password reset requires configured Supabase Auth.
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
          <button
            type="submit"
            className="rs-btn-primary w-full"
            disabled={!supabaseConfigured || submitting}
          >
            {submitting ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          <Link to="/login" className="text-rs-accent hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
