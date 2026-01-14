import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ---------------------------------------------
   Helpers
--------------------------------------------- */
async function exists(table, column, value) {
  const { data } = await supabase
    .from(table)
    .select(column)
    .eq(column, value)
    .maybeSingle();

  return !!data;
}

async function resolveRoleFromDB(userId) {
  if (await exists("admin_users", "user_id", userId)) return "admin";
  if (await exists("operators", "user_id", userId)) return "operator";
  if (await exists("owners", "id", userId)) return "owner";
  return "user";
}
function isPasswordRecovery() {
  try {
    return sessionStorage.getItem("password_recovery") === "true";
  } catch {
    return false;
  }
}


/* ---------------------------------------------
   useRole (SAFE VERSION)
--------------------------------------------- */
export function useRole() {
  const [role, setRole] = useState(() => {
    // Phase 1: instant role (no flicker)
    return localStorage.getItem("role") || "guest";
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      
      // SAFETY: freeze role resolution during password recovery
      if (isPasswordRecovery()) return;

      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        if (mounted) {
          setRole("guest");
          localStorage.removeItem("role");
        }
        return;
      }

      // Phase 2: authoritative role from DB
      const dbRole = await resolveRoleFromDB(user.id);

      if (mounted) {
        setRole(dbRole);
        localStorage.setItem("role", dbRole);
      }
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      //  SAFETY: ignore auth events during recovery
      if (isPasswordRecovery()) return;

      if (!session?.user) {
        setRole("guest");
        localStorage.removeItem("role");
      } else {
        // keep instant role, then refresh from DB
        load();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return role;
}
