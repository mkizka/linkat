import * as Sentry from "@sentry/react-router";

type Attributes = Record<string, string | number>;

export interface IMetrics {
  gauge: (name: string, value: number, unit: string) => void;
  count: (name: string, value: number, attributes: Attributes) => void;
  distribution: (
    name: string,
    value: number,
    unit: string,
    attributes: Attributes,
  ) => void;
}

export const metricsFactory = (): IMetrics => ({
  gauge: (name, value, unit) => Sentry.metrics.gauge(name, value, { unit }),
  count: (name, value, attributes) =>
    Sentry.metrics.count(name, value, { attributes }),
  distribution: (name, value, unit, attributes) =>
    Sentry.metrics.distribution(name, value, { unit, attributes }),
});
