import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { profileApi, type ProfilePayload } from "../api";
import { useAuth } from "../context/useAuth";

const YEARS = ["1st year", "2nd year", "3rd year", "4th year", "Postgraduate", "Other"];
const ACTIVITIES = ["walk", "meditation", "exercise", "reading", "music", "yoga", "other"];
const LANGUAGES = ["English", "Spanish", "French", "German", "Portuguese", "Mandarin", "Arabic", "Other"];

export default function OnboardingPage() {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<ProfilePayload>({
    name: "",
    course: "",
    academic_year: "1st year",
    preferred_language: "English",
    preferred_activity: "walk",
    available_daily_minutes: 30,
    notification_preferences: { email: true },
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field: keyof ProfilePayload, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await profileApi.upsert(form);
      await refreshProfile();
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message ?? "Could not save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
            Step 1 of 1
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Set up your profile
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            This helps us personalise your recommendations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="name"
              type="text"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Alex Johnson"
            />
          </div>

          {/* Course */}
          <div>
            <label htmlFor="course" className="block text-sm font-medium text-slate-700">
              Course / programme
            </label>
            <input
              id="course"
              type="text"
              required
              value={form.course}
              onChange={(e) => set("course", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Computer Science"
            />
          </div>

          {/* Academic year + Language */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-slate-700">
                Academic year
              </label>
              <select
                id="year"
                value={form.academic_year}
                onChange={(e) => set("academic_year", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {YEARS.map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="lang" className="block text-sm font-medium text-slate-700">
                Preferred language
              </label>
              <select
                id="lang"
                value={form.preferred_language}
                onChange={(e) => set("preferred_language", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Preferred activity */}
          <div>
            <label htmlFor="activity" className="block text-sm font-medium text-slate-700">
              Preferred wellness activity
            </label>
            <select
              id="activity"
              value={form.preferred_activity}
              onChange={(e) => set("preferred_activity", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {ACTIVITIES.map((a) => (
                <option key={a} value={a}>
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Available minutes */}
          <div>
            <label htmlFor="minutes" className="block text-sm font-medium text-slate-700">
              Available daily minutes for wellness activities:{" "}
              <span className="font-bold text-indigo-600">{form.available_daily_minutes} min</span>
            </label>
            <input
              id="minutes"
              type="range"
              min={10}
              max={180}
              step={5}
              value={form.available_daily_minutes}
              onChange={(e) => set("available_daily_minutes", Number(e.target.value))}
              className="mt-2 w-full accent-indigo-600"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>10 min</span>
              <span>180 min</span>
            </div>
          </div>

          {/* Email notifications */}
          <div className="flex items-center gap-3">
            <input
              id="email-notif"
              type="checkbox"
              checked={form.notification_preferences.email}
              onChange={(e) =>
                set("notification_preferences", { email: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="email-notif" className="text-sm text-slate-700">
              Send me email notifications
            </label>
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save and continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
