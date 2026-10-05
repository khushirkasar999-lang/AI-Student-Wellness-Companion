import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import CheckInPage from "./pages/CheckInPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import HistoryPage from "./pages/HistoryPage";
import PrivacyPage from "./pages/PrivacyPage";

/** Redirect authenticated users away from /login and /register */
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes — no layout chrome */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />

      {/* Onboarding — authenticated but no profile yet */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Main app — authenticated + profile required */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requireProfile>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/check-in"
        element={
          <ProtectedRoute requireProfile>
            <Layout>
              <CheckInPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recommendations"
        element={
          <ProtectedRoute requireProfile>
            <Layout>
              <RecommendationsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute requireProfile>
            <Layout>
              <HistoryPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/privacy"
        element={
          <ProtectedRoute requireProfile>
            <Layout>
              <PrivacyPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Root → dashboard (or login if not authenticated) */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 fallback */}
      <Route
        path="*"
        element={
          <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100">
            <p className="text-6xl font-bold text-slate-200">404</p>
            <p className="text-slate-500">Page not found</p>
            <a
              href="/dashboard"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Go home
            </a>
          </div>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
