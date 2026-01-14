import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en/translation.json";
import fr from "@/locales/fr/translation.json";
import pl from "@/locales/pl/translation.json";
import ar from "@/locales/ar/translation.json";
import ff from "@/locales/ff/translation.json";
import adlm from "@/locales/adlm/translation.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      pl: { translation: pl },
      ar: { translation: ar },
      ff: { translation: ff },
      adlm: { translation: adlm }
    },
    lng: "en",
    fallbackLng: "en",
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
