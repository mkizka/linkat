import { propagation } from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { SentryPropagator } from "@sentry/opentelemetry";
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

// SentryPropagatorは受信したtraceparentを読まないため、
// Railwayのエッジが始めたトレースを継続できるようW3C形式も読み取る
const w3c = new W3CTraceContextPropagator();
const sentry = new SentryPropagator();
propagation.disable();
propagation.setGlobalPropagator({
  inject: (ctx, carrier, setter) => sentry.inject(ctx, carrier, setter),
  extract: (ctx, carrier, getter) =>
    sentry.extract(w3c.extract(ctx, carrier, getter), carrier, getter),
  fields: () => sentry.fields(),
});
