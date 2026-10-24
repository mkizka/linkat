import "./tailwind.css";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { LoaderFunctionArgs } from "react-router";
import {
  data,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";
import { getToast, toastMiddleware } from "remix-toast/middleware";

import type { Route } from "./+types/root";
import { Toaster } from "./features/toast/toaster";
import { UmamiProvider } from "./hooks/useUmami";
import { getLocale, i18nextMiddleware, localeCookie } from "./i18n/i18n";
import { di } from "./server/di";
import { env } from "./utils/env";

export { ErrorBoundary } from "~/components/error-boundary";
export { HydrateFallback } from "~/components/hydate-fallback";

const metricsMiddleware: Route.MiddlewareFunction = async (
  { request, pattern },
  next,
) => {
  const start = performance.now();
  const response = await next();
  const labels = {
    method: request.method,
    route: pattern,
    status: String(response.status),
  };
  di.metrics.incrementCounter("http_requests_total", labels);
  di.metrics.observeHistogram(
    "http_request_duration_seconds",
    (performance.now() - start) / 1000,
    labels,
  );
  return response;
};

export const middleware = [
  metricsMiddleware,
  i18nextMiddleware,
  toastMiddleware(),
];

export async function loader({ context }: LoaderFunctionArgs) {
  const locale = getLocale(context);
  return data(
    {
      locale,
      toast: getToast(context),
      publicEnv: {
        UMAMI_URL: env.UMAMI_URL,
        UMAMI_WEBSITE_ID: env.UMAMI_WEBSITE_ID,
        SENTRY_DSN: env.SENTRY_DSN,
        SENTRY_ENVIRONMENT: env.SENTRY_ENVIRONMENT,
      },
    },
    { headers: { "Set-Cookie": await localeCookie.serialize(locale) } },
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const loaderData = useRouteLoaderData<typeof loader>("root");
  return (
    <html lang={loaderData?.locale ?? "en"}>
      <head>
        {loaderData?.publicEnv.UMAMI_URL &&
          loaderData.publicEnv.UMAMI_WEBSITE_ID && (
            <>
              <script
                defer
                src={`${loaderData.publicEnv.UMAMI_URL}/script.js`}
                data-website-id={loaderData.publicEnv.UMAMI_WEBSITE_ID}
              />
              <script
                defer
                src={`${loaderData.publicEnv.UMAMI_URL}/recorder.js`}
                data-website-id={loaderData.publicEnv.UMAMI_WEBSITE_ID}
              />
            </>
          )}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="icon"
          href="https://r2.linkat.blue/images/favicon.ico"
          sizes="48x48"
        />
        <link
          rel="apple-touch-icon"
          href="https://r2.linkat.blue/images/apple-touch-icon.png"
          sizes="180x180"
        />
        <Meta />
        <Links />
      </head>
      <body className="flex h-fit min-h-svh flex-col">
        <UmamiProvider>
          {children}
          <Toaster toast={loaderData?.toast ?? null} />
        </UmamiProvider>
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.publicEnv = ${JSON.stringify(loaderData?.publicEnv)}`,
          }}
        />
        <Scripts />
        <script async src="https://embed.bsky.app/static/embed.js"></script>
      </body>
    </html>
  );
}

export default function App({ loaderData: { locale } }: Route.ComponentProps) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  return <Outlet />;
}
