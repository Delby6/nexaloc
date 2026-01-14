import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

export default function EmailVerifyCallback() {
  const [message, setMessage] = useState("Verifying...");
  const [error, setError] = useState("");

  useEffect(() => {
    async function processCallback() {
      try {
        // 🔴 Handle expired or invalid links
        if (window.location.hash.includes("error=")) {
          const params = new URLSearchParams(
            window.location.hash.replace("#", "")
          );

          const description =
            params.get("error_description") ||
            "This link is invalid or has expired.";

          setError(description.replaceAll("+", " "));
          return;
        }

        // ✅ Supabase v1 automatically consumes the hash
        const { data, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError || !data?.session) {
          throw new Error("Session could not be established.");
        }

        // 🔍 Detect flow type from hash
        const type = new URLSearchParams(
          window.location.hash.replace("#", "")
        ).get("type");

        // 🔐 PASSWORD RECOVERY FLOW
        if (type === "recovery") {
          sessionStorage.setItem("password_recovery", "true");
          window.location.replace("/reset-password");
          return;
        }

        // ✅ Normal verification / magic-link flow
        const user = data.session.user;

        // Admin
        const { data: admin } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (admin) {
          localStorage.setItem("role", "admin");
          window.location.replace("/admin-dashboard");
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
          window.location.replace("/operator-dashboard");
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
          window.location.replace("/owner-dashboard");
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
          window.location.replace("/user-dashboard");
          return;
        }

        setMessage(
          "Email verified, but no profile found. Please contact support."
        );
      } catch (err) {
        console.error(err);
        setError(err.message || "Verification failed.");
      }
    }

    processCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="text-center text-white">
        <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-sky-400" />
        <h1 className="text-xl font-semibold mb-2">
          {error ? "Verification Error" : "Verifying"}
        </h1>
        <p className="text-slate-300 max-w-sm mx-auto">
          {error || message}
        </p>
      </div>
    </div>
  );
}
