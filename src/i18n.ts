import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import translationEN from "./locales/en/translation.json";
import translationMS from "./locales/ms/translation.json";
import translationZH from "./locales/zh/translation.json";
import translationES from "./locales/es/translation.json";
import translationFR from "./locales/fr/translation.json";

// the translations
const resources = {
    en: {
        translation: translationEN,
    },
    ms: {
        translation: translationMS,
    },
    zh: {
        translation: translationZH,
    },
    es: {
        translation: translationES,
    },
    fr: {
        translation: translationFR,
    },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
        resources,
        fallbackLng: "en", // use en if detected lng is not available

        interpolation: {
            escapeValue: false, // react already safes from xss
        },
    });

export default i18n;
