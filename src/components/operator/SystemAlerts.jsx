import { useNavigate } from "react-router-dom";
import { AlertTriangle, ExternalLink } from "lucide-react";

export default function SystemAlerts({ alerts }) {
  const navigate = useNavigate();

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="mt-6 rounded-xl border border-rose-700/60 bg-rose-950/40 text-rose-100 shadow-md shadow-rose-900/40">
      <div className="flex items-center justify-between px-4 py-3 border-b border-rose-800/60">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-300" />
          <h3 className="text-sm font-semibold tracking-wide uppercase">
            System Alerts
          </h3>
        </div>

        <button
          onClick={() => navigate("/operator-logs")}
          className="inline-flex items-center gap-1 rounded-full border border-rose-500/70 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-rose-100 hover:bg-rose-500/15"
        >
          <span>View in Logs</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      <ul className="px-4 py-3 space-y-1 text-xs">
        {alerts.map((a, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-rose-400" />
            <span>{a}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
