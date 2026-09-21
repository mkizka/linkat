import { redirect } from "react-router";

import { getInstance } from "~/i18n/i18n";
import { boardService } from "~/server/service/boardService";
import { sessionService } from "~/server/service/sessionService";
import { createLogger } from "~/utils/logger";

import type { Route } from "./+types/delete";

const logger = createLogger("delete");

export async function action({ request, context }: Route.ActionArgs) {
  const i18next = getInstance(context);
  const [userDid, agent] = await Promise.all([
    sessionService.getSessionUserDid(request),
    sessionService.getSessionAgent(request),
  ]);
  if (!userDid || !agent) {
    return { error: i18next.t("delete.invalid-session-error-message") };
  }
  try {
    await agent.deleteBoard();
  } catch (error) {
    logger.error(error, "PDSからボードの削除に失敗しました");
  }
  await boardService.deleteBoard(userDid);
  return redirect(`/`);
}
