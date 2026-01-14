import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AutoRedirectByRole() {
  const [loading, setLoading] = useState(true);
  const [redirect, setRedirect] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        setRedirect("/user-login");
        return;
      }

      const role = data.user.user_metadata?.role;

      if (role === "admin") setRedirect("/admin-dashboard");
      else if (role === "owner") setRedirect("/owner-dashboard");
      else setRedirect("/user-dashboard");

      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-white">Loading...</div>;

  return <Navigate to={redirect} />;
}