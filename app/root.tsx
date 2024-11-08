import "./tailwind.css";

import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  json,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteLoaderData,
} from "@remix-run/react";
import { useChangeLanguage } from "remix-i18next/react";

import { Toaster } from "./features/toast/toaster";
import { i18nServer, localeCookie } from "./i18n/i18n";
import { env } from "./utils/env";

export { ErrorBoundary } from "~/components/error-boundary";
export { HydrateFallback } from "~/components/hydate-fallback";

export const handle = { i18n: ["translation"] };

export async function loader({ request }: LoaderFunctionArgs) {
  const locale = await i18nServer.getLocale(request);
  return json(
    {
      locale,
      umami: {
        scriptUrl: env.UMAMI_SCRIPT_URL,
        websiteId: env.UMAMI_WEBSITE_ID,
      },
    },
    { headers: { "Set-Cookie": await localeCookie.serialize(locale) } },
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const loaderData = useRouteLoaderData<typeof loader>("root");
  return (
    <html lang={loaderData?.locale ?? "en"} className="font-murecho">
      <head>
        {loaderData?.umami.scriptUrl && loaderData.umami.websiteId && (
          <script
            defer
            src={loaderData.umami.scriptUrl}
            data-website-id={loaderData.umami.websiteId}
          />
        )}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="icon"
          href="https://assets.linkat.blue/0/favicon.ico"
          sizes="48x48"
        />
        <link
          rel="apple-touch-icon"
          href="https://assets.linkat.blue/0/apple-touch-icon.png"
          sizes="180x180"
        />
        <Meta />
        <Links />
      </head>
      <body className="flex h-fit min-h-svh flex-col bg-base-300">
        {children}
        <Toaster />
        <ScrollRestoration />
        <Scripts />
        <script async src="https://embed.bsky.app/static/embed.js"></script>
      </body>
    </html>
  );
}

export default function App() {
  const { locale } = useLoaderData<typeof loader>();
  useChangeLanguage(locale);
  return <Outlet />;
}
