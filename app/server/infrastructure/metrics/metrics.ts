import * as Sentry from "@sentry/react-router";

type Labels = Record<string, string>;

export interface IMetrics {
  incrementCounter: (name: string, labels: Labels) => void;
  setGauge: (name: string, value: number) => void;
  observeHistogram: (name: string, value: number, labels: Labels) => void;
}

const unitOf = (name: string) =>
  name.endsWith("_seconds") ? "second" : undefined;

export const metricsFactory = (): IMetrics => ({
  incrementCounter: (name, labels) =>
    Sentry.metrics.count(name, 1, { attributes: labels }),
  setGauge: (name, value) =>
    Sentry.metrics.gauge(name, value, { unit: unitOf(name) }),
  observeHistogram: (name, value, labels) =>
    Sentry.metrics.distribution(name, value, {
      unit: unitOf(name),
      attributes: labels,
    }),
});
