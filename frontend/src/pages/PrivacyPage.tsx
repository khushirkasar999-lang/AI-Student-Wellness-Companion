import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { privacyApi } from "../api";
import { useAuth } from "../context/useAuth";

export default function PrivacyPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const handleExport = async () => {
    setExportLoading(true);
    setError("");
    try {
      const data = await privacyApi.export();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wellness-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message ?? "Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setError("");
    try {
      await privacyApi.deleteAccount();
      await logout();
      navigate("/register", { replace: true });
    } catch (err: any) {
      setError(err.message ?? "Deletion failed");
      setDeleteLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Privacy &amp; Data</h1>
        <p className="mt-1 text-sm text-slate-500">
          You own your data. Export or delete it at any time.
        </p>
      </div>

      {/* What we collect */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">What we collect</h2>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex gap-2">
            <span className="text-indigo-500">•</span>
            Your email address (for authentication only).
          </li>
          <li className="flex gap-2">
            <span className="text-indigo-500">•</span>
            Profile information (name, course, preferences).
          </li>
          <li className="flex gap-2">
            <span className="text-indigo-500">•</span>
            Daily check-in responses (sleep, mood, workload, etc.).
          </li>
          <li className="flex gap-2">
            <span className="text-indigo-500">•</span>
            Computed stress scores and recommendations.
          </li>
        </ul>
        <p className="mt-3 text-xs text-slate-400">
          We do not sell your data or share it with third parties. All processing is done on our servers with no external AI/ML models.
        </p>
      </div>

      {/* Export */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Export your data</h2>
        <p className="mb-4 text-sm text-slate-500">
          Download a complete JSON file with your profile, all check-ins, and stress results.
        </p>
        <button
          onClick={handleExport}
          disabled={exportLoading}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {exportLoading ? "Preparing…" : "Download my data"}
        </button>
      </div>

      {/* Delete account */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="mb-2 text-base font-semibold text-red-900">Delete account</h2>
        <p className="mb-4 text-sm text-red-700">
          This permanently deletes your account and all associated data. This action cannot be undone.
        </p>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-lg bg-red-100 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-200"
          >
            Delete my account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-red-800">
              Are you absolutely sure? All your data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteLoading ? "Deleting…" : "Yes, delete everything"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
