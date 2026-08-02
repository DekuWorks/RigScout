import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { isSupabaseReady } from "@/lib/supabase";

export function SignupPage() {
  const ready = isSupabaseReady();

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Logo className="mb-8 justify-center" />
      <div className="rs-card p-6">
        <h1 className="font-display text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Start tracking parts and building smarter.
        </p>

        {!ready ? (
          <p className="mt-4 rounded-xl border border-rs-warning/40 bg-rs-warning/10 px-3 py-2 text-sm text-rs-warning">
            Sign-up activates in Phase 2 once Supabase Auth is configured.
          </p>
        ) : null}

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Display name</span>
            <input type="text" required className="rs-input" autoComplete="name" />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Email</span>
            <input type="email" required className="rs-input" autoComplete="email" />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Password</span>
            <input
              type="password"
              required
              minLength={8}
              className="rs-input"
              autoComplete="new-password"
            />
          </label>
          <button type="submit" className="rs-btn-primary w-full" disabled={!ready}>
            Sign up
          </button>
        </form>

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
