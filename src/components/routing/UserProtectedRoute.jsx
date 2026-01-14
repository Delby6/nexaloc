import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function UserProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const role = user.user_metadata?.role;

      if (role === "user") {
        setAllowed(true);
      }

      setLoading(false);
    }

    check();
  }, []);

  if (loading) return <p>Loading...</p>;

  return allowed ? children : <Navigate to="/user-login" replace />;
}
