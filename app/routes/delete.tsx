import { redirect } from "react-router";
import { setToast } from "remix-toast/middleware";

import { getInstance } from "~/i18n/i18n";
import { di } from "~/server/di";
import {
  editorDidContext,
  requireLogin,
} from "~/server/middleware/requireLogin";
import {
  BoardDbDeleteError,
  BoardPdsDeleteError,
} from "~/server/service/board/boardEvent";

import type { Route } from "./+types/delete";

export const middleware: Route.MiddlewareFunction[] = [requireLogin];

export async function action({ context }: Route.ActionArgs) {
  const logger = di.logger.child("delete");
  const i18next = getInstance(context);
  const editorDid = context.get(editorDidContext);
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
