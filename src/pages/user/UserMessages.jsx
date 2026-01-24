import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import OwnerUserChatCard from "@/components/chat/OwnerUserChatCard";
import { OWNER_CHAT_ENABLED } from "@/utils/chatTables";

export default function UserMessages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const businessId = searchParams.get("businessId");

  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      if (!OWNER_CHAT_ENABLED) {
        setLoading(false);
        return;
      }

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        navigate("/user-login");
        return;
      }

      setUser(authUser);

      if (!businessId) {
        setLoading(false);
        return;
      }

      const { data: businessRow, error: businessError } = await supabase
        .from("businesses")
        .select("id, name, owner_id")
        .eq("id", businessId)
        .single();

      if (businessError || !businessRow) {
        setError("We couldn't load that business chat.");
        setLoading(false);
        return;
      }

      setBusiness(businessRow);
      setLoading(false);
    }

    init();
  }, [businessId, navigate]);

  const content = useMemo(() => {
    if (!OWNER_CHAT_ENABLED) {
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          Owner chat is currently unavailable.
        </div>
      );
    }

    if (loading) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Loading chat...
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 shadow-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      );
    }

    if (!business) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Pick a business listing to start chatting with the owner.
        </div>
      );
    }

    return <OwnerUserChatCard business={business} user={user} />;
  }, [business, error, loading, user]);

  return (
    <div className="min-h-screen">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Messages
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Chat directly with business owners.
        </p>
      </div>

      {business && (
        <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Chatting about:{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {business.name}
          </span>
        </div>
      )}

      {content}
    </div>
  );
}