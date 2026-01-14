import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleContinue() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Session not found. Please log in again.");
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
        .select("id")
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

      // Regular user
      const { data: regularUser } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (regularUser) {
        localStorage.setItem("role", "user");
        window.location.href = "/user-dashboard";
        return;
      }

      throw new Error(
        "Your account was verified, but no profile was found."
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="text-center text-white max-w-md">
        <h1 className="text-2xl font-semibold mb-3">
          🎉 Account verified
        </h1>

        <p className="text-slate-300 mb-6">
          Congratulations! Your account has been successfully validated.
          Click the button below to continue to your dashboard.
        </p>

        {error && (
          <p className="text-red-400 text-sm mb-4">
            {error}
          </p>
        )}

        <button
          onClick={handleContinue}
          disabled={loading}
          className="
            px-6 py-2 rounded-lg
            bg-sky-600 hover:bg-sky-700
            disabled:opacity-50
            text-white font-medium
          "
        >
          {loading ? "Redirecting…" : "Go to dashboard"}
        </button>
      </div>
    </div>
  );
}
