import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "../locales/en/translation.json";
import ru from "../locales/ru/translation.json";

const LANG_STORAGE_KEY = "sound-generator-lang";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "ru"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANG_STORAGE_KEY,
      caches: ["localStorage"],
    },
  });

function syncDocumentLang(lng: string) {
  document.documentElement.lang = lng;
  document.title = i18n.t("app.title");
}

i18n.on("languageChanged", syncDocumentLang);
syncDocumentLang(i18n.language);

export default i18n;
