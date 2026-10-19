import { redirect } from "react-router";
import { setToast } from "remix-toast/middleware";

import { getInstance } from "~/i18n/i18n";
import { di } from "~/server/di";

import type { Route } from "./+types/delete";

export async function action({ request, context }: Route.ActionArgs) {
  const i18next = getInstance(context);
  const editorDid = await di.sessionService.getSessionDid(request);
  if (!editorDid) {
    setToast(context, {
      message: i18next.t("delete.invalid-session-error-message"),
      type: "error",
    });
    return redirect("/login", {
      headers: {
        "Set-Cookie": await di.sessionService.destroySession(request),
      },
    });
  }
  const result = await di.boardEventService.handleEditorDelete(editorDid);
  switch (result.type) {
    case "pds-failed":
      setToast(context, {
        message: i18next.t("delete.delete-board-error-message"),
        type: "error",
      });
      return redirect("/settings");
    case "db-failed":
      setToast(context, {
        message: i18next.t("delete.delete-delayed-warning-message"),
        type: "warning",
      });
      return redirect("/");
    case "deleted":
      return redirect("/");
  }
}
