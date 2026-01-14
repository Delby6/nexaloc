import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";
import { Loader2, Mail, Lock, User } from "lucide-react";

export default function UserSignup() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setMessage("");
    setTermsError("");

    if (!acceptedTerms) {
      setTermsError("You must accept the Terms & Conditions to continue.");
      return;
    }

    setLoading(true);

    try {
      const termsAcceptedAt = new Date().toISOString();

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            role: "user",
            full_name: fullName,

            // ✅ OPTION A: SOURCE OF TRUTH = auth.user_metadata
            terms_accepted: true,
            terms_accepted_at: termsAcceptedAt,
          },
        },
      });

      if (signUpError) throw signUpError;

      // ✅ Do NOT insert into public.users here (RLS will block at signup time)
      setMessage("Account created! Please verify your email.");

      setEmail("");
      setPassword("");
      setFullName("");
      setAcceptedTerms(false);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* HEADER */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300 mb-3">
            <User className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold">Create User Account</h1>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs mb-1">Full Name</label>
            <input
              type="text"
              placeholder="Full name"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* TERMS */}
          <div className="pt-2">
            <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  setTermsError("");
                }}
                className="mt-1"
              />
              <span>
                I agree to the{" "}
                <a
                  href="/legal/terms"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-600 hover:underline"
                >
                  Terms & Conditions
                </a>{" "}
                and{" "}
                <a
                  href="/legal/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-600 hover:underline"
                >
                  Privacy Policy
                </a>
              </span>
            </label>

            {termsError && (
              <p className="text-xs text-red-500 mt-1">{termsError}</p>
            )}
          </div>

          <button
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-lg flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            Create Account
          </button>
        </form>

        {message && (
          <p className="text-emerald-500 text-center mt-4 text-sm">{message}</p>
        )}
        {error && (
          <p className="text-red-500 text-center mt-4 text-sm">{error}</p>
        )}

        <p className="text-center text-slate-400 mt-6 text-xs">
          Already have an account?{" "}
          <Link to="/login" className="text-sky-500 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
