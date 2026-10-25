import { data } from "react-router";
import { setToast } from "remix-toast/middleware";

import { getInstance } from "~/i18n/i18n";
import { di } from "~/server/di";
import {
  editorDidContext,
  requireLogin,
} from "~/server/middleware/requireLogin";

import type { Route } from "./+types/sync";

export const middleware: Route.MiddlewareFunction[] = [requireLogin];

export async function action({ context }: Route.ActionArgs) {
  const logger = di.logger.child("sync");
  const editorDid = context.get(editorDidContext);
  let result;
  try {
    result = await di.boardEventService.handleSync(editorDid);
  } catch (error) {
    logger.error("同期に失敗しました", { error });
    return data({ ok: false }, { status: 500 });
  }
  logger.info("同期に成功しました", {
    ownerDid: editorDid,
    boardImported: result.boardImported,
  });
  if (result.boardImported) {
    setToast(context, {
      message: getInstance(context).t("sync.success-message"),
      type: "success",
    });
  }
  return { ok: true };
}
