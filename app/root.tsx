import "./tailwind.css";

import { useEffect, useState } from "react";
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
import { UmamiProvider } from "./hooks/useUmami";
import { getLocale, i18nextMiddleware, localeCookie } from "./i18n/i18n";
import { cn } from "./utils/cn";
import { env } from "./utils/env";

export { ErrorBoundary } from "~/components/error-boundary";
export { HydrateFallback } from "~/components/hydate-fallback";

export const middleware = [i18nextMiddleware, toastMiddleware()];

export async function loader({ context }: LoaderFunctionArgs) {
  const locale = getLocale(context);
  return data(
    {
      locale,
      toast: getToast(context),
      umami: {
        scriptUrl: env.UMAMI_SCRIPT_URL,
        websiteId: env.UMAMI_WEBSITE_ID,
      },
      ENV: {
        SENTRY_DSN: env.SENTRY_DSN,
      },
    },
    { headers: { "Set-Cookie": await localeCookie.serialize(locale) } },
  );
}

const TOAST_DURATION = 5000;

function Toaster({ toast }: { toast: ReturnType<typeof getToast> }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    const timer = setTimeout(
      () => setVisible(false),
      toast.duration ?? TOAST_DURATION,
    );
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;
  return (
    <div
      className={cn(
        "toast toast-center w-full max-w-screen-sm whitespace-normal opacity-90",
        !visible && "animate-out fade-out-10",
      )}
    >
      <div
        className={cn("alert text-start", {
          "alert-success": toast.type === "success",
          "alert-error": toast.type === "error",
          "alert-info": toast.type === "info",
          "alert-warning": toast.type === "warning",
        })}
      >
        <span>{toast.message}</span>
      </div>
    </div>
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
        <UmamiProvider>
          {children}
          <Toaster toast={loaderData?.toast ?? null} />
        </UmamiProvider>
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(loaderData?.ENV)}`,
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
