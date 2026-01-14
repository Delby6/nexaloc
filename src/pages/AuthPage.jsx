import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";
import { Lock, Mail, Loader2 } from "lucide-react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  async function findRole(user) {
    const userId = user.id;
    const userEmail = user.email;

    //
    // 1. ADMIN CHECK — admin_users.user_id
    //
    {
      const { data } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        return { role: "admin", redirect: "/admin-dashboard" };
      }
    }

    //
    // 2. OPERATOR CHECK — operators.user_id
    //
    {
      const { data } = await supabase
        .from("operators")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        return { role: "operator", redirect: "/operator-dashboard" };
      }
    }

    //
    // 3. OWNER CHECK — owners.id = auth.users.id
    //
    {
      const { data } = await supabase
        .from("owners")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (data) {
        return { role: "owner", redirect: "/owner-dashboard" };
      }
    }

    //
    // 4. USER CHECK — users.id = auth.users.id
    //
    {
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (data) {
        return { role: "user", redirect: "/user-dashboard" };
      }
    }

    //
    // 5. No role found
    //
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");

    try {
      //
      // 1. Log in with Supabase Auth
      //
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const user = data?.user;
      if (!user) throw new Error("Unexpected: No user returned.");

      //
      // 2. Determine role based on tables
      //
      const roleInfo = await findRole(user);

      if (!roleInfo) {
        setInfoMsg(
          "Login successful, but no profile found. Please complete signup or contact support."
        );
        return;
      }

      //
      // 3. Redirect
      //
      setInfoMsg(`Signed in as ${roleInfo.role}. Redirecting…`);

      // Save role in Supabase metadata (for DashboardRouter)
      await supabase.auth.updateUser({
        data: { role: roleInfo.role },
      });

      // Save role for the UI hook as fallback
      localStorage.setItem("role", roleInfo.role);

      window.location.href = roleInfo.redirect;
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8">

          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300 mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-semibold">Sign in to Nexaloc</h1>
            
          </div>
          

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white py-2.5 rounded-lg flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {errorMsg && (
            <p className="mt-3 text-xs text-rose-500 bg-rose-50 dark:bg-rose-900/20 p-2 rounded">
              {errorMsg}
            </p>
          )}
          {infoMsg && !errorMsg && (
            <p className="mt-3 text-xs text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded">
              {infoMsg}
            </p>
          )}

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400"></div>
            <p className="text-center text-xs text-slate-400 mb-4">
              <Link to="/forgot-password" className="text-sky-400 hover:underline">
                Forgot your password?
              </Link>
            </p>



          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            <p className="mb-2">Don't have an account?</p>
            <div className="flex flex-col gap-2">
              <Link
                to="/user-signup"
                className="p-2 rounded-lg border border-sky-500 text-sky-600 text-xs"
              >
                Sign up as User
              </Link>
              <Link
                to="/owner-signup"
                className="p-2 rounded-lg border border-emerald-500 text-emerald-600 text-xs"
              >
                Sign up as Owner
              </Link>
            </div>
            
          </div>

        </div>
      </div>
    </div>
  );
}
