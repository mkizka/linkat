import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import * as Sentry from "@sentry/react-router";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  enableLogs: true,
  integrations: [Sentry.pinoIntegration()],
  openTelemetrySpanProcessors:
    process.env.NODE_ENV === "production"
      ? [new BatchSpanProcessor(new OTLPTraceExporter())]
      : [],
});
