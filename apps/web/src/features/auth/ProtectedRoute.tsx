import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "./useAuth";

/**
 * Protects /app routes when Supabase is configured.
 * In demo mode (no credentials), allows access so local UI work can continue.
 */
export function ProtectedRoute() {
  const { loading, user, supabaseConfigured } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="mx-auto max-w-md space-y-3 px-4 py-20" aria-busy="true" aria-label="Loading session">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (supabaseConfigured && !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
