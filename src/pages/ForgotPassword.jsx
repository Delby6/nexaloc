import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";
import { Mail, Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          // ✅ FIX: send recovery emails to the universal email callback
          redirectTo: `${window.location.origin}/email-verify-callback`,
        }
      );

      if (resetError) throw resetError;

      setMessage("A password reset link has been sent to your email.");
    } catch (err) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md bg-slate-800 rounded-xl p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-white text-center mb-6">
          Reset your password
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-3 rounded bg-slate-700 text-white"
              placeholder="Enter your email"
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 py-3 rounded-lg text-white flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            Send Reset Link
          </button>
        </form>

        {message && (
          <p className="mt-4 text-emerald-400 text-center text-sm">{message}</p>
        )}
        {error && (
          <p className="mt-4 text-rose-400 text-center text-sm">{error}</p>
        )}

        <p className="text-center text-slate-400 mt-6 text-xs">
          Remembered your password?{" "}
          <Link to="/login" className="text-sky-400 hover:underline">
            Go back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
