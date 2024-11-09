import type { InitOptions } from "i18next";

import en from "./locales/en.json";
import ja from "./locales/ja.json";

export const i18nConfig: InitOptions = {
  supportedLngs: ["en", "ja"],
  fallbackLng: "en",
  defaultNS: "translation",
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: { translation: en },
    ja: { translation: ja },
  },
};
