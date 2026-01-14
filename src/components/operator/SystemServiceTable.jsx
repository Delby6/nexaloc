export default function SystemServiceTable({ services }) {
  // Always normalize services to a valid object
  const safe = (services && typeof services === "object" && !Array.isArray(services))
    ? services
    : {};

  // Build rows safely — NEVER trust s to exist
  const rows = Object.entries(safe).map(([name, s]) => {
    const ok = s?.ok ?? false;
    const ms = s?.ms ?? 0;
    const lastChecked = s?.lastChecked ? new Date(s.lastChecked) : new Date();

    return {
      name,
      ok,
      ms,
      lastChecked,
    };
  });

  if (!rows.length) {
    return (
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow">
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
          Service Status
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No services available yet…
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow">
      <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
        Service Status
      </h3>

      <table className="w-full text-sm">
        <thead className="text-slate-600 dark:text-slate-400">
          <tr>
            <th className="py-2 text-left">Service</th>
            <th className="py-2 text-left">Status</th>
            <th className="py-2 text-left">Latency</th>
            <th className="py-2 text-left">Last Check</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-t border-slate-200 dark:border-slate-800">
              <td className="py-2 capitalize">{row.name}</td>
              <td className="py-2">{row.ok ? "🟢 OK" : "🔴 Down"}</td>
              <td className="py-2">{row.ms} ms</td>
              <td className="py-2">{row.lastChecked.toLocaleTimeString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
