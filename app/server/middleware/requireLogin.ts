import type { Did } from "@atproto/did";
import { createContext, type MiddlewareFunction, redirect } from "react-router";
import { setToast } from "remix-toast/middleware";

import { getInstance } from "~/i18n/i18n";
import { di } from "~/server/di";

export const editorDidContext = createContext<Did>();

export const requireLogin: MiddlewareFunction<Response> = async (
  { request, context },
  next,
) => {
  const editorDid = await di.sessionService.getSessionDid(request);
  if (!editorDid) {
    if (request.method !== "GET") {
      setToast(context, {
        message: getInstance(context).t(
          "require-login.invalid-session-error-message",
        ),
        type: "error",
      });
    }
    throw redirect("/login", {
      headers: {
        "Set-Cookie": await di.sessionService.destroySession(request),
      },
    });
  }
  context.set(editorDidContext, editorDid);
  return next();
};
