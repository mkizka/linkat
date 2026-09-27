import * as Sentry from "@sentry/react-router";

// トレースはOpenTelemetryで記録してRailwayに送るため、Sentryのトレーシングは無効のままにする
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [Sentry.pinoIntegration(), Sentry.openTelemetryIntegration()],
});
