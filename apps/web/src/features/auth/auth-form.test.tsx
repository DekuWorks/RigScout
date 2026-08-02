import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LoginPage } from "@/pages/auth/LoginPage";

vi.mock("@/lib/supabase", () => ({
  isSupabaseReady: () => false,
  getSupabase: () => null,
}));

vi.mock("@/features/auth/useAuth", () => ({
  useAuth: () => ({
    ready: true,
    loading: false,
    supabaseConfigured: false,
    session: null,
    user: null,
    profile: null,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
    refreshProfile: vi.fn(),
    updateProfile: vi.fn(),
  }),
}));

describe("LoginPage", () => {
  it("shows demo-mode notice when Supabase is not configured", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/supabase credentials/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeDisabled();
  });
});
