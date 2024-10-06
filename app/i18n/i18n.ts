import { createCookie } from "@remix-run/node";
import { RemixI18Next } from "remix-i18next/server";

import { i18nConfig } from "./config";

// https://sergiodxa.com/tutorials/add-i18n-to-a-remix-vite-app
export const localeCookie = createCookie("lng", {
  httpOnly: true,
  maxAge: 30 * 24 * 60 * 60,
  secure: process.env.NODE_ENV === "production",
});

export const i18nServer = new RemixI18Next({
  detection: {
    supportedLanguages: i18nConfig.supportedLngs,
    fallbackLanguage: i18nConfig.fallbackLng,
    cookie: localeCookie,
  },
  i18next: i18nConfig,
});
