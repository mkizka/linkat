import { redirect } from "react-router";
import { setToast } from "remix-toast/middleware";

import { getInstance } from "~/i18n/i18n";
import { di } from "~/server/di";

import type { Route } from "./+types/export.reauth";

export async function action({ request, context }: Route.ActionArgs) {
  const logger = di.logger.child("export.reauth");
  const editorDid = await di.sessionService.getSessionDid(request);
  if (!editorDid) {
    return redirect("/login");
  }
  try {
    const url = await di.authService.authorizeExport(editorDid);
    logger.info("書き出しのための再ログインを開始しました");
    return redirect(url.toString());
  } catch (error) {
    logger.error("書き出しのための再ログインに失敗しました", { error });
    setToast(context, {
      message: getInstance(context).t("export.reauth-error-message"),
      type: "error",
    });
    return redirect("/export");
  }
}
