import "./tailwind.css";

import type { ClientLoaderFunction } from "@remix-run/react";
import {
  Links,
  Meta,
  Outlet,
  redirect,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { getDefaultStore } from "jotai";

import { userAtom } from "./atoms/user/base";
import { resumeSessionAtom } from "./atoms/user/write-only";
import { Toaster } from "./features/toast/toaster";
import { createLogger } from "./utils/logger";

export { ErrorBoundary } from "~/components/error-boundary";
export { HydrateFallback } from "~/components/hydate-fallback";

const LOGIN_REQUIRED_PATHS = ["/edit"];

const logger = createLogger("root.tsx");

export const clientLoader: ClientLoaderFunction = async ({ request }) => {
  const store = getDefaultStore();
  await store.set(resumeSessionAtom);
  const user = store.get(userAtom);
  const pathname = new URL(request.url).pathname;
  if (!user && LOGIN_REQUIRED_PATHS.includes(pathname)) {
    logger.debug("未ログインのためリダイレクトしました");
    return redirect("/");
  }
  return null;
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="font-murecho">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-base-300">
        <main className="mx-auto min-h-svh max-w-screen-sm px-4">
          {children}
        </main>
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
