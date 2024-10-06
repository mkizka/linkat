import "./tailwind.css";

import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import { Toaster } from "./features/toast/toaster";

export { ErrorBoundary } from "~/components/error-boundary";
export { HydrateFallback } from "~/components/hydate-fallback";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="font-murecho">
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
