// src/components/CookieModal.jsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

async function logConsentToServer(payload) {
  try {
    await fetch("/api/cookies/consent-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("Failed to log cookie consent:", err);
  }
}

export default function CookieModal({ onClose, setVisible, role, userId }) {
  const { t } = useTranslation("cookies");

  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  const savePreferences = () => {
    const prefs = {
      necessary: true,
      analytics,
      marketing
    };

    localStorage.setItem("cookie-preferences", JSON.stringify(prefs));

    logConsentToServer({
      user_id: userId,
      role,
      action: "customized",
      preferences: prefs
    });

    setVisible(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center 
                    items-center z-[10000] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full 
                      shadow-xl border border-slate-300 dark:border-slate-700 space-y-5">

        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {t("modal.title")}
        </h2>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("modal.description")}
        </p>

        {/* Strictly necessary */}
        <div>
          <h3 className="font-semibold">{t("modal.necessaryTitle")}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("modal.necessaryDesc")}
          </p>
        </div>

        {/* Analytics */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold">{t("modal.analyticsTitle")}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("modal.analyticsDesc")}
            </p>
          </div>
          <input
            type="checkbox"
            checked={analytics}
            onChange={() => setAnalytics(!analytics)}
          />
        </div>

        {/* Marketing */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold">{t("modal.marketingTitle")}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("modal.marketingDesc")}
            </p>
          </div>
          <input
            type="checkbox"
            checked={marketing}
            onChange={() => setMarketing(!marketing)}
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-3 pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-slate-400 
                       hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {t("modal.cancel")}
          </button>

          <button
            onClick={savePreferences}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg 
                       hover:bg-blue-700"
          >
            {t("modal.save")}
          </button>
        </div>

      </div>
    </div>
  );
}
