import { initReactI18next } from "react-i18next";
import { createCookie } from "react-router";
import { createI18nextMiddleware } from "remix-i18next";

import { i18nConfig } from "./config";

// https://sergiodxa.com/tutorials/add-i18n-to-a-remix-vite-app
export const localeCookie = createCookie("lng", {
  httpOnly: true,
  maxAge: 30 * 24 * 60 * 60,
  secure: process.env.NODE_ENV === "production",
});

export const [i18nextMiddleware, getLocale, getInstance] =
  createI18nextMiddleware({
    detection: {
      supportedLanguages: i18nConfig.supportedLngs,
      fallbackLanguage: i18nConfig.fallbackLng,
      cookie: localeCookie,
    },
    i18next: i18nConfig,
    plugins: [initReactI18next],
  });
