import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

export default function OwnerProtectedRoute({ children }) {
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    const checkOwner = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) {
        setAuthorized(false);
        return;
      }

      // Check if user exists in 'owners' table
      const { data: ownerCheck, error } = await supabase
        .from("owners")
        .select("id")
        .eq("id", session.user.id)
        .single();

      if (error || !ownerCheck) {
        setAuthorized(false);
      } else {
        setAuthorized(true);
      }
    };

    checkOwner();
  }, []);

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Checking owner access...
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/owner-signup" replace />;
  }

  return children;
}
