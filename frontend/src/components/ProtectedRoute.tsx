import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

interface Props {
  children: React.ReactNode;
  /** If true, redirect to /onboarding when profile is missing */
  requireProfile?: boolean;
}

export default function ProtectedRoute({ children, requireProfile }: Props) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireProfile && !profile) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
