import { redirect } from "react-router";
import { setToast } from "remix-toast/middleware";

import { getInstance } from "~/i18n/i18n";
import { di } from "~/server/di";
import { createLogger } from "~/utils/logger";

import type { Route } from "./+types/delete";

const logger = createLogger("delete");

export async function action({ request, context }: Route.ActionArgs) {
  const i18next = getInstance(context);
  const [userDid, agent] = await Promise.all([
    di.sessionService.getSessionUserDid(request),
    di.sessionService.getSessionAgent(request),
  ]);
  if (!userDid || !agent) {
    setToast(context, {
      message: i18next.t("delete.invalid-session-error-message"),
      type: "error",
    });
    return redirect("/");
  }
  try {
    await agent.deleteBoard();
  } catch (error) {
    logger.error(error, "PDSからボードの削除に失敗しました");
  }
  await di.boardService.deleteBoard(userDid);
  return redirect(`/`);
}
