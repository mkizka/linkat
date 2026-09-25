import * as Sentry from "@sentry/react-router";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 6),
  tracesSampleRate: 1.0,
  beforeSend(event) {
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (
        error?.type === "NotFoundException" ||
        error?.value?.includes("404")
      ) {
        return null;
      }
    }
    return event;
  },
});
