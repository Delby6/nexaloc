// src/pages/DashboardRouter.jsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardRouter() {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    async function resolveDestination() {
       // BLOCK dashboards during password recovery
      const isRecovery =
        sessionStorage.getItem("password_recovery") === "true";

      if (isRecovery) {
        setTarget("/reset-password");
        return;
      }
      
      const { data, error } = await supabase.auth.getUser();
      const user = data?.user;

      if (error || !user) {
        setTarget("/user-login");
        return;
      }

      const role = user.user_metadata?.role;

      if (role === "admin") {
        setTarget("/admin-dashboard");
      } else if (role === "operator") {
        setTarget("/operator-dashboard");
      }  else if (role === "owner") {
        setTarget("/owner-dashboard");
      } else if (role === "user") {
        setTarget("/user-dashboard");
      } else {
        // Unknown / missing role → send to generic login
        setTarget("/user-login");
      }
    }

    resolveDestination();
  }, []);

  if (!target) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        Redirecting to your dashboard...
      </div>
    );
  }

  return <Navigate to={target} replace />;
}
