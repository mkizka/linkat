import { PassThrough } from "node:stream";

import { createReadableStreamFromReadable } from "@react-router/node";
import { createInstance } from "i18next";
import { isbot } from "isbot";
import type { RenderToPipeableStreamOptions } from "react-dom/server";
import { renderToPipeableStream } from "react-dom/server";
import { I18nextProvider, initReactI18next } from "react-i18next";
import type {
  ActionFunctionArgs,
  AppLoadContext,
  EntryContext,
  LoaderFunctionArgs,
} from "react-router";
import { isRouteErrorResponse, ServerRouter } from "react-router";

import { i18nConfig } from "./i18n/config";
import { i18nServer } from "./i18n/i18n";
import { createLogger } from "./utils/logger";

export const streamTimeout = 5_000;

const createI18nInstance = async (
  request: Request,
  routerContext: EntryContext,
) => {
  const instance = createInstance();
  const lng = await i18nServer.getLocale(request);
  const ns = i18nServer.getRouteNamespaces(routerContext);
  await instance.use(initReactI18next).init({
    ...i18nConfig,
    lng,
    ns,
  });
  return instance;
};

const logger = createLogger("entry.server");

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext,
  // If you have middleware enabled:
  // loadContext: unstable_RouterContextProvider
) {
  const instance = await createI18nInstance(request, routerContext);
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const userAgent = request.headers.get("user-agent");

    // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
    // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
    const readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode
        ? "onAllReady"
        : "onShellReady";

    const { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={instance}>
        <ServerRouter context={routerContext} url={request.url} />
      </I18nextProvider>,
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            logger.error(
              {
                error,
              },
              "renderToPipeableStreamでエラーが発生しました",
            );
          }
        },
      },
    );

    // Abort the rendering stream after the `streamTimeout` so it has time to
    // flush down the rejected boundaries
    setTimeout(abort, streamTimeout + 1000);
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
  logger.error(error, "サーバーエラーが発生しました");
}
