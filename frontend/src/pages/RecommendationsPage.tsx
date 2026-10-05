import { useEffect, useState } from "react";
import { recommendationsApi, type Recommendation } from "../api";

const CATEGORY_ICONS: Record<string, string> = {
  Sleep: "🌙",
  "Study Planning": "📚",
  "Time Management": "⏰",
  "Physical Activity": "🏃",
  "Social Connection": "🤝",
  "Professional Support": "💬",
};

function RecommendationCard({
  rec,
  onComplete,
}: {
  rec: Recommendation;
  onComplete: (id: number) => void;
}) {
  const [completing, setCompleting] = useState(false);
  const icon = CATEGORY_ICONS[rec.category] ?? "✨";

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await recommendationsApi.complete(rec.id);
      onComplete(rec.id);
    } catch {
      setCompleting(false);
    }
  };

  return (
    <li className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-sm sm:flex-row sm:items-start">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xl">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {rec.category}
          </span>
          <span className="text-xs text-slate-400">~{rec.estimated_minutes} min</span>
        </div>
        <p className="mt-1.5 text-sm font-semibold text-slate-900">{rec.title}</p>
        <p className="mt-1 text-sm text-slate-600">{rec.description}</p>
      </div>
      <button
        onClick={handleComplete}
        disabled={completing}
        className="shrink-0 self-start rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
        aria-label={`Mark "${rec.title}" as complete`}
      >
        {completing ? "Saving…" : "Mark done ✓"}
      </button>
    </li>
  );
}

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    recommendationsApi
      .list()
      .then((data) => { if (!cancelled) setRecs(data); })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleComplete = (id: number) => {
    setRecs((prev) => prev.filter((r) => r.id !== id));
  };

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
        Failed to load recommendations: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Recommendations</h1>
        <p className="mt-1 text-sm text-slate-500">
          Personalised based on your latest check-in. Mark each one done when you've completed it.
        </p>
      </div>

      {recs.length === 0 ? (
        <div className="rounded-xl bg-slate-50 p-8 text-center">
          <p className="text-slate-500">
            No active recommendations right now. Complete a check-in to get personalised suggestions.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {recs.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} onComplete={handleComplete} />
          ))}
        </ul>
      )}
    </div>
  );
}
