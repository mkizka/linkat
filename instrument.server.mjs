import * as Sentry from "@sentry/react-router";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || "production",
  integrations: [Sentry.pinoIntegration(), Sentry.openTelemetryIntegration()],
});
