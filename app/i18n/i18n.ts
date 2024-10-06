import { RemixI18Next } from "remix-i18next/server";

import { i18nConfig } from "./config";

export const i18nServer = new RemixI18Next({
  detection: {
    supportedLanguages: i18nConfig.supportedLngs,
    fallbackLanguage: i18nConfig.fallbackLng,
  },
  i18next: i18nConfig,
});
