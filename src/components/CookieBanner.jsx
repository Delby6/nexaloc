// src/components/CookieBanner.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CookieModal from "./CookieModal";
import { API_BASE } from "@/lib/apiBase";

// ---------- Supabase Backend Call ----------
async function logConsentToServer(payload) {
  try {
    const res = await fetch(`${API_BASE}/api/cookies/consent-log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("Consent POST response:", data);

  } catch (err) {
    console.error("Failed to log cookie consent:", err);
  }
}


export default function CookieBanner() {
  const { t } = useTranslation("cookies");

  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Get role and logged user ID
  const role = localStorage.getItem("role"); // "user", "owner", "admin", null
  const userId = localStorage.getItem("userId") || null;

  useEffect(() => {
    const stored = localStorage.getItem("cookie-preferences");

    // -----------------------------
    // ROLE-BASED AUTO RULES
    // -----------------------------

    // 1. Admin → no banner, auto-necessary only
    if (role === "admin") {
      if (!stored) {
        const prefs = { necessary: true, analytics: false, marketing: false };

        localStorage.setItem("cookie-preferences", JSON.stringify(prefs));

        logConsentToServer({
          user_id: userId,
          role,
          action: "auto-admin",
          preferences: prefs
        });
      }
      return;
    }

    // 2. Owner → auto allow analytics (business necessity)
    if (role === "owner" && !stored) {
      const prefs = { necessary: true, analytics: true, marketing: false };

      localStorage.setItem("cookie-preferences", JSON.stringify(prefs));

      logConsentToServer({
        user_id: userId,
        role,
        action: "auto-owner",
        preferences: prefs
      });

      return;
    }

    // 3. User or Guest → show banner if no preference exists
    if (!stored) setVisible(true);
  }, []);

  // -----------------------------
  // HANDLERS
  // -----------------------------

  const acceptAll = () => {
    const prefs = { necessary: true, analytics: true, marketing: true };

    localStorage.setItem("cookie-preferences", JSON.stringify(prefs));

    logConsentToServer({
      user_id: userId,
      role,
      action: "accepted",
      preferences: prefs
    });

    setVisible(false);
  };

  const declineAll = () => {
    const prefs = { necessary: true, analytics: false, marketing: false };

    localStorage.setItem("cookie-preferences", JSON.stringify(prefs));

    logConsentToServer({
      user_id: userId,
      role,
      action: "declined",
      preferences: prefs
    });

    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 flex justify-center px-4 pt-4 z-[9999] animate-slide-down">
        <div className="max-w-3xl w-full bg-white dark:bg-slate-800 shadow-xl 
                        rounded-3xl border border-slate-200 dark:border-slate-700 
                        p-5 flex flex-col sm:flex-row items-center gap-4">

          <p className="text-sm text-slate-700 dark:text-slate-300 flex-1">
            {t("banner.message")}{" "}
            <Link to="/legal/cookies" className="text-blue-600 dark:text-blue-400 underline">
              {t("banner.learnMore")}
            </Link>.
          </p>

          <div className="flex gap-3 whitespace-nowrap">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-sm rounded-full border border-slate-300 
                         dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              {t("banner.customize")}
            </button>

            <button
              onClick={declineAll}
              className="px-4 py-2 text-sm rounded-full border border-slate-300 
                         dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              {t("banner.decline")}
            </button>

            <button
              onClick={acceptAll}
              className="px-4 py-2 text-sm rounded-full bg-blue-600 text-white 
                         hover:bg-blue-700 transition"
            >
              {t("banner.accept")}
            </button>
          </div>

        </div>
      </div>

      {showModal && (
        <CookieModal
          role={role}
          userId={userId}
          onClose={() => setShowModal(false)}
          setVisible={setVisible}
        />
      )}
    </>
  );
}
