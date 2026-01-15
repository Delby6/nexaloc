import { API_BASE } from "@/lib/apiBase";

export default function SystemActions() {
  async function trigger(action) {
    try {
      await fetch(`${API_BASE}/api/system/${action}`, {
        method: "POST"
      });
      alert(`Action triggered: ${action}`);
    } catch (e) {
      alert("Failed: " + e.message);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow space-y-3">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Operator Actions
      </h3>

      <button onClick={() => trigger("restart")} className="btn-danger">
        Restart Services
      </button>
      <button onClick={() => trigger("flush-cache")} className="btn-secondary">
        Flush Cache
      </button>
      <button onClick={() => trigger("diagnostics")} className="btn-secondary">
        Run Diagnostics
      </button>
      <button onClick={() => trigger("recheck")} className="btn-secondary">
        Force Health Re-check
      </button>
    </div>
  );
}
