import { redirect } from "react-router";
import { setToast } from "remix-toast/middleware";

import { getInstance } from "~/i18n/i18n";
import { requireLogin } from "~/server/middleware/requireLogin";
import { isExperimental, serializeExperimental } from "~/utils/experimental";

import type { Route } from "./+types/experimental";

export const middleware: Route.MiddlewareFunction[] = [requireLogin];

export async function loader({ request, context }: Route.LoaderArgs) {
  const enabled = !(await isExperimental(request));
  setToast(context, {
    message: getInstance(context).t(
      enabled
        ? "experimental.enabled-message"
        : "experimental.disabled-message",
    ),
    type: "success",
  });
  return redirect("/", {
    headers: { "Set-Cookie": await serializeExperimental(enabled) },
  });
}
