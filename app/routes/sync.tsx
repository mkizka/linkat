import { data, redirect } from "react-router";
import { setToast } from "remix-toast/middleware";

import { getInstance } from "~/i18n/i18n";
import { di } from "~/server/di";
import { createLogger } from "~/utils/logger";

import type { Route } from "./+types/sync";

const logger = createLogger("sync");

export async function action({ request, context }: Route.ActionArgs) {
  const editorDid = await di.sessionService.getSessionDid(request);
  if (!editorDid) {
    throw redirect("/login");
  }
  let result;
  try {
    result = await di.boardEventService.handleEditorSync(editorDid);
  } catch (error) {
    logger.error(error, "同期に失敗しました");
    return data({ ok: false }, { status: 500 });
  }
  if (result.boardImported) {
    setToast(context, {
      message: getInstance(context).t("edit.sync-success-message"),
      type: "success",
    });
  }
  return { ok: true };
}
