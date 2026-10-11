import * as Sentry from "@sentry/react-router";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || "production",
  integrations: [Sentry.pinoIntegration(), Sentry.openTelemetryIntegration()],
  // アクセスログ(pino-http)は件数が多く、HTTPメトリクスで代替できるため標準出力にだけ出す
  beforeSendLog: (log) => (log.attributes?.name === "http" ? null : log),
});
