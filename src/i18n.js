import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en/translation.json";
import fr from "@/locales/fr/translation.json";
import ar from "@/locales/ar/translation.json";
import ff from "@/locales/ff/translation.json";
import adlm from "@/locales/adlm/translation.json";
import enCookies from "@/locales/en/cookies.json";
import frCookies from "@/locales/fr/cookies.json";

const storedLang =
  typeof window !== "undefined"
    ? window.localStorage.getItem("nexaloc_language")
    : null;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en, cookies: enCookies },
      fr: { translation: fr, cookies: frCookies },
      // pl: { translation: pl, cookies: plCookies },
      ar: { translation: ar },
      ff: { translation: ff },
      adlm: { translation: adlm }
    },
    lng: storedLang || "en",
    fallbackLng: "en",
    keySeparator: false,
    nsSeparator: false,
    returnNull: false,
    returnEmptyString: false,
    interpolation: { escapeValue: false }
  });

// 🧭 Handle direction (RTL for Arabic and Adlam)
i18n.on("languageChanged", (lng) => {
  const html = document.documentElement;
  if (lng === "ar" || lng === "adlm") {
    html.dir = "rtl";
    html.lang = lng;
  } else {
    html.dir = "ltr";
    html.lang = lng;
  }
});

export default i18n;
