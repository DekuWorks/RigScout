import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";

const authState = {
  loading: false,
  user: null as null | { id: string },
  supabaseConfigured: true,
};

vi.mock("./useAuth", () => ({
  useAuth: () => ({
    loading: authState.loading,
    user: authState.user,
    supabaseConfigured: authState.supabaseConfigured,
  }),
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login screen</div>} />
        <Route path="/app" element={<ProtectedRoute />}>
          <Route index element={<div>App home</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("redirects to login when Supabase is configured and user is missing", () => {
    authState.loading = false;
    authState.user = null;
    authState.supabaseConfigured = true;
    renderAt("/app");
    expect(screen.getByText("Login screen")).toBeInTheDocument();
  });

  it("allows access in demo mode without Supabase", () => {
    authState.loading = false;
    authState.user = null;
    authState.supabaseConfigured = false;
    renderAt("/app");
    expect(screen.getByText("App home")).toBeInTheDocument();
  });

  it("renders outlet when authenticated", () => {
    authState.loading = false;
    authState.user = { id: "user-1" };
    authState.supabaseConfigured = true;
    renderAt("/app");
    expect(screen.getByText("App home")).toBeInTheDocument();
  });
});
