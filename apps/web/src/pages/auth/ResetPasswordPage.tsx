import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/features/auth/useAuth";

export function ResetPasswordPage() {
  const { updatePassword, supabaseConfigured, user } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(password);
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Logo className="mb-8 justify-center" />
      <div className="rs-card p-6">
        <h1 className="font-display text-2xl font-bold">Choose a new password</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {user
            ? "Enter a new password for your RigScout account."
            : "Open this page from the email reset link so your session can be recovered."}
        </p>

        {!supabaseConfigured ? (
          <p className="mt-4 rounded-xl border border-rs-warning/40 bg-rs-warning/10 px-3 py-2 text-sm text-rs-warning">
            Supabase is not configured.
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="mt-4 rounded-xl border border-rs-danger/40 bg-rs-danger/10 px-3 py-2 text-sm text-rs-danger">
            {error}
          </p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">New password</span>
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
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Confirm password</span>
            <input
              type="password"
              required
              minLength={8}
              className="rs-input"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="rs-btn-primary w-full"
            disabled={!supabaseConfigured || !user || submitting}
          >
            {submitting ? "Updating…" : "Update password"}
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
