import "./tailwind.css";

import type { LoaderFunctionArgs } from "react-router";
import {
  data,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteLoaderData,
} from "react-router";
import { useChangeLanguage } from "remix-i18next/react";

import { Toaster } from "./features/toast/toaster";
import { i18nServer, localeCookie } from "./i18n/i18n";
import { env } from "./utils/env";

export { ErrorBoundary } from "~/components/error-boundary";
export { HydrateFallback } from "~/components/hydate-fallback";

export const handle = { i18n: ["translation"] };

export async function loader({ request }: LoaderFunctionArgs) {
  const locale = await i18nServer.getLocale(request);
  return data(
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

const umamiPlaceholderScript = `\
if (typeof window !== 'undefined' && !window.umami) {
  window.umami = {
    track: function(...args) {
      console.warn('Umami not loaded yet', args);
    }
  };
}`;

export function Layout({ children }: { children: React.ReactNode }) {
  const loaderData = useRouteLoaderData<typeof loader>("root");
  return (
    <html lang={loaderData?.locale ?? "en"} className="font-murecho">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: umamiPlaceholderScript,
          }}
        />
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
