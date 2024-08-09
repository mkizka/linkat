import "./tailwind.css";

import type { ClientLoaderFunction } from "@remix-run/react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { createStore } from "jotai";

import { resumeSessionAtom } from "./atoms/user/write-only";

export { HydrateFallback } from "~/components/hydate-fallback";

export const clientLoader: ClientLoaderFunction = async () => {
  const store = createStore();
  await store.set(resumeSessionAtom);
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
      <body className="min-h-screen bg-base-200">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <main className="mx-auto max-w-screen-sm px-4">
      <Outlet />
    </main>
  );
}
