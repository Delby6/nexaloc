import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Lock } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [validSession, setValidSession] = useState(true);

  useEffect(() => {
  // 🚨 HARD OVERRIDE: stop any auto-redirects
  sessionStorage.setItem("password_recovery", "true");
}, []);

  // ---------------------------------------------------
  // Guard: ensure we have a valid recovery session
  // ---------------------------------------------------
  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!data?.session) {
        setError(
          "This password reset link is invalid or has expired. Please request a new one."
        );
        setValidSession(false);
      }
    }

    checkSession();
  }, []);

  // ---------------------------------------------------
  // Handle password reset
  // ---------------------------------------------------
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message || "Failed to reset password.");
      return;
    }

    // ✅ clear recovery lock
    sessionStorage.removeItem("password_recovery" );

    setMessage("Password updated successfully. Redirecting…");

    // ---------------------------------------------------
    // Redirect after success
    // ---------------------------------------------------
    setTimeout(async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      // Admin
      const { data: admin } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (admin) {
        localStorage.setItem("role", "admin");
        window.location.href = "/admin-dashboard";
        return;
      }

      // Operator
      const { data: operator } = await supabase
        .from("operators")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (operator) {
        localStorage.setItem("role", "operator");
        window.location.href = "/operator-dashboard";
        return;
      }

      // Owner
      const { data: owner } = await supabase
        .from("owners")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (owner) {
        localStorage.setItem("role", "owner");
        window.location.href = "/owner-dashboard";
        return;
      }

      // Default user
      localStorage.setItem("role", "user");
      window.location.href = "/user-dashboard";
    }, 1200);
  }

  // ---------------------------------------------------
  // Block UI if invalid session
  // ---------------------------------------------------
  if (!validSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="text-center text-rose-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md bg-slate-800 rounded-xl p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-white text-center mb-6">
          Set a new password
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-3 py-3 rounded bg-slate-700 text-white"
              placeholder="New password"
            />
          </div>

          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full pl-9 pr-3 py-3 rounded bg-slate-700 text-white"
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 py-3 rounded-lg text-white flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            Reset password
          </button>
        </form>

        {message && (
          <p className="mt-4 text-emerald-400 text-center text-sm">
            {message}
          </p>
        )}

        {error && (
          <p className="mt-4 text-rose-400 text-center text-sm">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
