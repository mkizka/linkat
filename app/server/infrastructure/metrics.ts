import * as Sentry from "@sentry/react-router";

export interface IMetrics {
  gauge: (name: string, value: number, unit: string) => void;
}

export const metricsFactory = (): IMetrics => ({
  gauge: (name, value, unit) => Sentry.metrics.gauge(name, value, { unit }),
});
