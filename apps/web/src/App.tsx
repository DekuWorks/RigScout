import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { SignupPage } from "@/pages/auth/SignupPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { SettingsPage } from "@/pages/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route path="/app" element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route
          path="discover"
          element={
            <PlaceholderPage
              title="Discover Parts"
              description="Search, filters, deal-score sorting, and pagination arrive in Phase 3."
              phase="Phase 3"
            />
          }
        />
        <Route
          path="builds"
          element={
            <PlaceholderPage
              title="Build Lab"
              description="Create builds, compatibility guidance, and exports arrive in Phase 4."
              phase="Phase 4"
            />
          }
        />
        <Route
          path="deals"
          element={
            <PlaceholderPage
              title="Deals"
              description="Trending drops and deal scores arrive with catalog ingestion in Phase 3."
              phase="Phase 3"
            />
          }
        />
        <Route
          path="watchlist"
          element={
            <PlaceholderPage
              title="Watchlist & Alerts"
              description="Target prices, channels, and realtime notifications arrive in Phase 5."
              phase="Phase 5"
            />
          }
        />
        <Route
          path="learn"
          element={
            <PlaceholderPage
              title="Learn"
              description="Beginner guides in Markdown arrive in Phase 6."
              phase="Phase 6"
            />
          }
        />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
