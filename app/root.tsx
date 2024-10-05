import "./tailwind.css";

import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { useChangeLanguage } from "remix-i18next/react";

import { Toaster } from "./features/toast/toaster";
import { i18next } from "./i18next.server";

export { ErrorBoundary } from "~/components/error-boundary";
export { HydrateFallback } from "~/components/hydate-fallback";

export async function loader({ request }: LoaderFunctionArgs) {
  const locale = await i18next.getLocale(request);
  return { locale };
}

export const handle = {
  i18n: "common",
};

export function Layout({ children }: { children: React.ReactNode }) {
  // https://wp-kyoto.net/use-userouteloaderdata-insteadof-useloaderdata-on-layout-component/
  const locale = useRouteLoaderData<typeof loader>("root")!.locale;
  const { i18n } = useTranslation();

  useChangeLanguage(locale);

  return (
    <html lang={locale} dir={i18n.dir()} className="font-murecho">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
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
  return <Outlet />;
}
