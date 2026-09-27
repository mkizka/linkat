import * as Sentry from "@sentry/react-router";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [Sentry.pinoIntegration(), Sentry.openTelemetryIntegration()],
});
