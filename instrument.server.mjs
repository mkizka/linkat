import * as Sentry from "@sentry/react-router";

if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  const { NodeSDK } = await import("@opentelemetry/sdk-node");
  const { getNodeAutoInstrumentations } =
    await import("@opentelemetry/auto-instrumentations-node");
  const sdk = new NodeSDK({ instrumentations: getNodeAutoInstrumentations() });
  sdk.start();
  process.on("SIGTERM", () => {
    void sdk.shutdown().finally(() => process.exit(0));
  });
}

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [Sentry.pinoIntegration(), Sentry.openTelemetryIntegration()],
});
