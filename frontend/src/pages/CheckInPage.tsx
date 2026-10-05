import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkinsApi, type CheckinPayload, type CheckinResponse } from "../api";

/** A 1–5 slider field */
function RatingField({
  id,
  label,
  hint,
  value,
  lowLabel,
  highLabel,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  lowLabel: string;
  highLabel: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
        {hint && <span className="ml-1 text-xs text-slate-400">({hint})</span>}
        <span className="ml-2 text-sm font-bold text-indigo-600">{value}</span>
      </label>
      <input
        id={id}
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-indigo-600"
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={value}
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

const INITIAL: CheckinPayload = {
  sleep_duration: 7,
  sleep_quality: 3,
  academic_workload: 3,
  deadline_pressure: 3,
  study_hours: 4,
  mood: 3,
  energy: 3,
  physical_activity: 3,
  social_connectedness: 3,
  financial_concern: 1,
  self_reported_stress: 3,
  note: "",
};

function StressLevelBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    low: "bg-emerald-100 text-emerald-800",
    moderate: "bg-amber-100 text-amber-800",
    high: "bg-red-100 text-red-800",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${colors[level] ?? "bg-slate-100 text-slate-700"}`}>
      {level.toUpperCase()}
    </span>
  );
}

export default function CheckInPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<CheckinPayload>(INITIAL);
  const [result, setResult] = useState<CheckinResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field: keyof CheckinPayload, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await checkinsApi.submit(form);
      setResult(res);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message ?? "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  /* ── Result screen ── */
  if (result) {
    const { stress, recommendations } = result;
    return (
      <div className="space-y-6">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Check-in complete ✓</h1>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Stress score</p>
              <p className="text-5xl font-bold text-slate-900">{stress.score}</p>
            </div>
            <StressLevelBadge level={stress.level} />
          </div>

          {stress.explanation && (
            <p className="mt-4 text-sm text-slate-700">{stress.explanation}</p>
          )}

          {stress.factors.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                Key contributing factors
              </p>
              <div className="flex flex-wrap gap-2">
                {stress.factors.map((f) => (
                  <span
                    key={f.key}
                    className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                  >
                    {f.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {recommendations.length > 0 && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Personalised recommendations
            </h2>
            <ul className="space-y-3">
              {recommendations.map((rec) => (
                <li key={rec.ruleKey} className="rounded-lg bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{rec.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{rec.description}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {rec.category} · ~{rec.estimatedMinutes} min
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Safety message for high stress */}
        {stress.level === "high" && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-semibold text-red-800">
              Your stress level is high. Please consider speaking with a campus support resource.
            </p>
            <p className="mt-2 text-sm text-red-700">
              Crisis line: <strong>988</strong> (Suicide &amp; Crisis Lifeline, US) or contact your university counselling service.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => { setResult(null); setForm(INITIAL); }}
            className="rounded-lg bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-300"
          >
            New check-in
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Daily check-in</h1>
        <p className="mt-1 text-sm text-slate-500">
          Takes about 2 minutes. Your answers are private and used only to estimate your stress level.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Sleep */}
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Sleep
          </h2>
          <div className="space-y-5">
            <div>
              <label htmlFor="sleep_duration" className="block text-sm font-medium text-slate-700">
                Sleep duration last night{" "}
                <span className="font-bold text-indigo-600">{form.sleep_duration}h</span>
              </label>
              <input
                id="sleep_duration"
                type="range"
                min={0}
                max={12}
                step={0.5}
                value={form.sleep_duration}
                onChange={(e) => set("sleep_duration", Number(e.target.value))}
                className="mt-1 w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>0h</span><span>12h</span>
              </div>
            </div>

            <RatingField
              id="sleep_quality"
              label="Sleep quality"
              value={form.sleep_quality}
              lowLabel="Very poor"
              highLabel="Excellent"
              onChange={(v) => set("sleep_quality", v)}
            />
          </div>
        </section>

        {/* Academic */}
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Academic
          </h2>
          <div className="space-y-5">
            <RatingField
              id="academic_workload"
              label="Academic workload"
              value={form.academic_workload}
              lowLabel="Very light"
              highLabel="Overwhelming"
              onChange={(v) => set("academic_workload", v)}
            />
            <RatingField
              id="deadline_pressure"
              label="Deadline pressure"
              value={form.deadline_pressure}
              lowLabel="No deadlines"
              highLabel="Critical"
              onChange={(v) => set("deadline_pressure", v)}
            />
            <div>
              <label htmlFor="study_hours" className="block text-sm font-medium text-slate-700">
                Study hours today{" "}
                <span className="font-bold text-indigo-600">{form.study_hours}h</span>
              </label>
              <input
                id="study_hours"
                type="range"
                min={0}
                max={20}
                step={0.5}
                value={form.study_hours}
                onChange={(e) => set("study_hours", Number(e.target.value))}
                className="mt-1 w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>0h</span><span>20h</span>
              </div>
            </div>
          </div>
        </section>

        {/* Wellbeing */}
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Wellbeing
          </h2>
          <div className="space-y-5">
            <RatingField
              id="mood"
              label="Mood"
              value={form.mood}
              lowLabel="Very low"
              highLabel="Great"
              onChange={(v) => set("mood", v)}
            />
            <RatingField
              id="energy"
              label="Energy level"
              value={form.energy}
              lowLabel="Exhausted"
              highLabel="Full of energy"
              onChange={(v) => set("energy", v)}
            />
            <RatingField
              id="physical_activity"
              label="Physical activity"
              value={form.physical_activity}
              lowLabel="Sedentary"
              highLabel="Very active"
              onChange={(v) => set("physical_activity", v)}
            />
            <RatingField
              id="social_connectedness"
              label="Social connectedness"
              value={form.social_connectedness}
              lowLabel="Very isolated"
              highLabel="Very connected"
              onChange={(v) => set("social_connectedness", v)}
            />
            <RatingField
              id="financial_concern"
              label="Financial concern"
              value={form.financial_concern}
              lowLabel="None"
              highLabel="Severe"
              onChange={(v) => set("financial_concern", v)}
            />
            <RatingField
              id="self_reported_stress"
              label="How stressed do you feel overall?"
              value={form.self_reported_stress}
              lowLabel="Not at all"
              highLabel="Extremely"
              onChange={(v) => set("self_reported_stress", v)}
            />
          </div>
        </section>

        {/* Note */}
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <label htmlFor="note" className="block text-sm font-medium text-slate-700">
            Optional note
          </label>
          <textarea
            id="note"
            rows={3}
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            placeholder="Anything else you want to note about today…"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </section>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
        >
          {loading ? "Submitting…" : "Submit check-in"}
        </button>
      </form>
    </div>
  );
}
