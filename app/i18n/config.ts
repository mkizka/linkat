import en from "./locales/en.json";
import ja from "./locales/ja.json";

export const i18nConfig = {
  supportedLngs: ["en", "ja"],
  fallbackLng: "en",
  defaultNS: "translation",
  resources: {
    en: { translation: en },
    ja: { translation: ja },
  },
};
