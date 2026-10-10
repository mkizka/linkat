import { redirect } from "react-router";
import { setToast } from "remix-toast/middleware";

import { getInstance } from "~/i18n/i18n";
import { di } from "~/server/di";
import {
  BoardDbDeleteError,
  BoardPdsDeleteError,
} from "~/server/service/board/boardEvent";

import type { Route } from "./+types/delete";

export async function action({ request, context }: Route.ActionArgs) {
  const logger = di.logger.child("delete");
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
  try {
    await di.boardEventService.handleEditorDelete(editorDid);
  } catch (error) {
    if (error instanceof BoardPdsDeleteError) {
      logger.error(error.message, { error });
      setToast(context, {
        message: i18next.t("delete.delete-board-error-message"),
        type: "error",
      });
      return redirect("/settings");
    }
    if (error instanceof BoardDbDeleteError) {
      logger.error(error.message, { error });
      setToast(context, {
        message: i18next.t("delete.delete-delayed-warning-message"),
        type: "warning",
      });
      return redirect("/");
    }
    throw error;
  }
  logger.info("ボードを削除しました", { ownerDid: editorDid });
  return redirect("/");
}
