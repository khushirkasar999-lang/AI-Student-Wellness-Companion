import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { checkinsApi, stressApi, type Checkin, type StressTrend } from "../api";


function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [trends, setTrends] = useState<StressTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([checkinsApi.list(), stressApi.trends()])
      .then(([ci, tr]) => {
        setCheckins(ci);
        setTrends([...tr].reverse()); // oldest first for chart
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
        Failed to load history: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">History</h1>
        <p className="mt-1 text-sm text-slate-500">
          All your past check-ins and stress trends.
        </p>
      </div>

      {/* Trend chart */}
      {trends.length > 1 && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            Stress score over time
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="created_at"
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                }
                tick={{ fontSize: 11 }}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: any) => [`${v}`, "Stress score"]}
                labelFormatter={(l) => new Date(l).toLocaleString()}
              />
              {/* Reference lines for thresholds */}
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="4 2" label={{ value: "Low", position: "right", fontSize: 10, fill: "#10b981" }} />
              <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: "Moderate", position: "right", fontSize: 10, fill: "#f59e0b" }} />
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

      {/* Check-in list */}
      {checkins.length === 0 ? (
        <div className="rounded-xl bg-slate-50 p-8 text-center">
          <p className="text-slate-500">No check-ins yet. Start your first one!</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Sleep</th>
                <th className="px-4 py-3">Mood</th>
                <th className="px-4 py-3">Energy</th>
                <th className="px-4 py-3">Workload</th>
                <th className="px-4 py-3">Stress (self)</th>
              </tr>
            </thead>
            <tbody>
              {checkins.map((ci, i) => (
                <tr
                  key={ci.id}
                  className={`border-b last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                >
                  <td className="px-4 py-3 text-slate-600">{formatDate(ci.created_at)}</td>
                  <td className="px-4 py-3 text-slate-700">{ci.sleep_duration}h / {ci.sleep_quality}★</td>
                  <td className="px-4 py-3 text-slate-700">{ci.mood}/5</td>
                  <td className="px-4 py-3 text-slate-700">{ci.energy}/5</td>
                  <td className="px-4 py-3 text-slate-700">{ci.academic_workload}/5</td>
                  <td className="px-4 py-3 text-slate-700">{ci.self_reported_stress}/5</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
