import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/check-in", label: "Check-in" },
  { to: "/recommendations", label: "Recommendations" },
  { to: "/history", label: "History" },
  { to: "/privacy", label: "Privacy" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Brand */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-lg font-bold text-indigo-600">Wellness</span>
            <span className="hidden text-sm text-slate-500 sm:inline">
              AI Student Companion
            </span>
          </Link>

          {/* Nav */}
          {user && (
            <nav className="hidden gap-1 md:flex">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    pathname.startsWith(to)
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}

          {/* User actions */}
          {user && (
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-slate-400 sm:inline">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-full bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-300"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile nav */}
        {user && (
          <div className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  pathname.startsWith(to)
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
