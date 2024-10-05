/* eslint-disable no-console */
import { resolve } from "node:path";

import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  createReadableStreamFromReadable,
  type EntryContext,
} from "@remix-run/node";
import { isRouteErrorResponse, RemixServer } from "@remix-run/react";
import { createInstance } from "i18next";
import Backend from "i18next-fs-backend";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { PassThrough } from "stream";

import i18n from "./i18n"; // your i18n configuration file
import { i18next } from "./i18next.server";

const ABORT_DELAY = 5000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  const callbackName = isbot(request.headers.get("user-agent"))
    ? "onAllReady"
    : "onShellReady";

  const instance = createInstance();
  const lng = await i18next.getLocale(request);
  const ns = i18next.getRouteNamespaces(remixContext);

  await instance
    .use(initReactI18next) // Tell our instance to use react-i18next
    .use(Backend) // Setup our backend
    .init({
      ...i18n, // spread the configuration
      lng, // The locale we detected above
      ns, // The namespaces the routes about to render wants to use
      backend: { loadPath: resolve("./public/locales/{{lng}}/{{ns}}.json") },
    });

  return new Promise((resolve, reject) => {
    let didError = false;

    const { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={instance}>
        <RemixServer context={remixContext} url={request.url} />
      </I18nextProvider>,
      {
        [callbackName]: () => {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: didError ? 500 : responseStatusCode,
            }),
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          reject(error);
        },
        onError(error: unknown) {
          didError = true;
          console.error(error);
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}

// デフォルトのハンドラはこれ
// https://github.com/remix-run/remix/blob/8f38118e44298d609224c6074ae6519d385196f1/packages/remix-server-runtime/server.ts#L71-L78
export function handleError(
  error: unknown,
  { request }: LoaderFunctionArgs | ActionFunctionArgs,
) {
  if (
    (isRouteErrorResponse(error) && error.status === 404) ||
    request.signal.aborted
  ) {
    return;
  }
  console.error(error);
}
