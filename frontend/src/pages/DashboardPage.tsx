import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { dashboardApi, stressApi, type DashboardData, type StressTrend } from "../api";
import { useAuth } from "../context/useAuth";

const LEVEL_COLORS: Record<string, string> = {
  low: "text-emerald-700 bg-emerald-50",
  moderate: "text-amber-700 bg-amber-50",
  high: "text-red-700 bg-red-50",
};

function StressCard({ score, level }: { score: number; level: string }) {
  const colorClass = LEVEL_COLORS[level] ?? "text-slate-700 bg-slate-50";
  return (
    <div className={`rounded-xl p-5 ${colorClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
        Current stress level
      </p>
      <p className="mt-2 text-4xl font-bold">{score}</p>
      <p className="mt-1 text-sm font-medium capitalize">{level}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [trends, setTrends] = useState<StressTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([dashboardApi.get(), stressApi.trends()])
      .then(([dashboard, trendData]) => {
        setData(dashboard);
        setTrends(trendData.slice(0, 14).reverse()); // last 14 entries, oldest first
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-700">
        Failed to load dashboard: {error}
      </div>
    );
  }

  const name = profile?.name ?? "there";
  const latestStress = data?.latestStress;
  const checkinCount = data?.recentCheckins.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hi, {name} 👋</h1>
        <p className="mt-1 text-sm text-slate-500">
          Here's your wellness snapshot for today.
        </p>
      </div>

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {latestStress ? (
          <StressCard score={latestStress.score} level={latestStress.level} />
        ) : (
          <div className="rounded-xl bg-slate-100 p-5">
            <p className="text-sm text-slate-500">No check-in yet</p>
            <Link
              to="/check-in"
              className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Start check-in
            </Link>
          </div>
        )}

        <div className="rounded-xl bg-indigo-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 opacity-70">
            Recent check-ins
          </p>
          <p className="mt-2 text-4xl font-bold text-indigo-900">{checkinCount}</p>
          <p className="mt-1 text-sm text-indigo-700">last 5 entries</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active recommendations
          </p>
          <p className="mt-2 text-4xl font-bold text-slate-900">
            {data?.recommendations.length ?? 0}
          </p>
          <Link
            to="/recommendations"
            className="mt-1 inline-block text-sm text-indigo-600 hover:underline"
          >
            View all →
          </Link>
        </div>
      </div>

      {/* Stress trend chart */}
      {trends.length > 1 && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            Stress score over time
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="created_at"
                tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                tick={{ fontSize: 11 }}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: any) => [`${v}`, "Stress score"]}
                labelFormatter={(l) => new Date(l).toLocaleString()}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Explanation */}
      {latestStress?.explanation && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
          <p className="text-sm font-medium text-indigo-800">{latestStress.explanation}</p>
        </div>
      )}

      {/* Recent recommendations */}
      {(data?.recommendations.length ?? 0) > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Recommended actions
            </h2>
            <Link to="/recommendations" className="text-sm text-indigo-600 hover:underline">
              See all
            </Link>
          </div>
          <ul className="space-y-3">
            {data!.recommendations.slice(0, 3).map((rec) => (
              <li key={rec.id} className="rounded-lg bg-slate-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">{rec.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {rec.category} · ~{rec.estimated_minutes} min
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/check-in"
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          New check-in
        </Link>
        <Link
          to="/history"
          className="rounded-lg bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-300"
        >
          View history
        </Link>
      </div>
    </div>
  );
}
