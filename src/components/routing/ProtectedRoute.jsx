import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const [authorized, setAuthorized] = useState(null); // null = loading, false = no, true = yes

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) {
        setAuthorized(false);
        return;
      }

      // If this route is admin-only, verify they’re in admin_users
      if (adminOnly) {
        const { data: adminCheck, error } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", session.user.id)
          .single();

        if (error || !adminCheck) {
          setAuthorized(false);
          return;
        }
      }

      setAuthorized(true);
    };

    checkAuth();
  }, [adminOnly]);

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Checking access...
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to={adminOnly ? "/admin-login" : "/login"} replace />;
  }

  return children;
}
