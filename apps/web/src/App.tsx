import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { DashboardPage } from "@/pages/DashboardPage";
import { DealsPage } from "@/pages/DealsPage";
import { DiscoverPage } from "@/pages/DiscoverPage";
import { BuildDetailPage } from "@/pages/BuildDetailPage";
import { BuildsPage } from "@/pages/BuildsPage";
import { LandingPage } from "@/pages/LandingPage";
import { LearnPage } from "@/pages/LearnPage";
import { ProductDetailPage } from "@/pages/ProductDetailPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { SignupPage } from "@/pages/auth/SignupPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { SharedBuildPage } from "@/pages/SharedBuildPage";
import { WatchlistPage } from "@/pages/WatchlistPage";

const LearnGuidePage = lazy(() =>
  import("@/pages/LearnGuidePage").then((mod) => ({ default: mod.LearnGuidePage })),
);

function LearnGuideFallback() {
  return (
    <div className="mx-auto max-w-3xl space-y-4" aria-busy="true" aria-label="Loading guide">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route path="/app" element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="discover/:slug" element={<ProductDetailPage />} />
          <Route path="builds" element={<BuildsPage />} />
          <Route path="builds/:buildId" element={<BuildDetailPage />} />
          <Route path="deals" element={<DealsPage />} />
          <Route path="watchlist" element={<WatchlistPage />} />
          <Route path="learn" element={<LearnPage />} />
          <Route
            path="learn/:slug"
            element={
              <Suspense fallback={<LearnGuideFallback />}>
                <LearnGuidePage />
              </Suspense>
            }
          />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="/share/:slug" element={<SharedBuildPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
