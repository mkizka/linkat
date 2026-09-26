import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import * as Sentry from "@sentry/react-router";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  // Railwayのトレースにも送信する。エンドポイント等はRailwayが設定するOTEL_*環境変数から読まれる
  openTelemetrySpanProcessors: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    ? [new BatchSpanProcessor(new OTLPTraceExporter())]
    : [],
});
