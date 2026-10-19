import type { MiddlewareFunction } from "react-router";

import { di } from "~/server/di";

import { editorDidContext } from "./requireLogin";

export const requireAdmin: MiddlewareFunction<Response> = (
  { context },
  next,
) => {
  if (!di.moderationService.isAdmin(context.get(editorDidContext))) {
    throw new Response("Forbidden", { status: 403 });
  }
  return next();
};
