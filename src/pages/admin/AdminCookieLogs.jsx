import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminCookieLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load logs from Supabase View
  const loadLogs = async () => {
    const { data, error } = await supabase
      .from("admin_cookie_logs")
      .select("*");

    if (error) {
      console.error("Error loading cookie logs:", error);
    } else {
      setLogs(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const downloadCSV = () => {
    fetch("/api/cookies/export-csv", {
      headers: {
        "x-admin-role": "admin" // TODO: replace with secure JWT middleware later
      }
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "cookie_logs.csv";
        a.click();
      });
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500">
        Loading cookie logs...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Cookie Consent Logs</h1>

        <button
          onClick={downloadCSV}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Download CSV
        </button>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto border border-slate-300 rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="border p-2">User ID</th>
              <th className="border p-2">Role</th>
              <th className="border p-2">Action</th>
              <th className="border p-2">Preferences</th>
              <th className="border p-2">IP Address</th>
              <th className="border p-2">User Agent</th>
              <th className="border p-2">Created</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="border p-2">{log.user_id || "guest"}</td>
                <td className="border p-2">{log.role || "-"}</td>
                <td className="border p-2">{log.action}</td>
                <td className="border p-2 text-xs">
                  {JSON.stringify(log.preferences)}
                </td>
                <td className="border p-2">{log.ip_address}</td>
                <td className="border p-2 text-xs">{log.user_agent}</td>
                <td className="border p-2">
                  {new Date(log.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
