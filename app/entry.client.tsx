import * as Sentry from "@sentry/react-router";
import i18next from "i18next";
import I18nextBrowserLanguageDetector from "i18next-browser-languagedetector";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { HydratedRouter } from "react-router/dom";

import { i18nConfig } from "./i18n/config";

Sentry.init({
  dsn: window.ENV.SENTRY_DSN,
  integrations: [
    Sentry.reactRouterTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

async function main() {
  await i18next
    .use(initReactI18next)
    .use(I18nextBrowserLanguageDetector)
    .init({
      ...i18nConfig,
      detection: { order: ["htmlTag"], caches: [] },
    });

  startTransition(() => {
    hydrateRoot(
      document,
      <I18nextProvider i18n={i18next}>
        <StrictMode>
          <HydratedRouter
            instrumentations={[Sentry.createSentryClientInstrumentation()]}
            onError={Sentry.sentryOnError}
          />
        </StrictMode>
      </I18nextProvider>,
    );
  });
}

// eslint-disable-next-line
main().catch((error) => console.error(error));
