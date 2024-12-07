import { redirect } from "react-router";

import { i18nServer } from "~/i18n/i18n";
import { getSessionAgent, getSessionUserDid } from "~/server/oauth/session";
import { boardService } from "~/server/service/boardService";
import { createLogger } from "~/utils/logger";

import type { Route } from "./+types/delete";

const logger = createLogger("delete");

export async function action({ request }: Route.ActionArgs) {
  const t = await i18nServer.getFixedT(request);
  const [userDid, agent] = await Promise.all([
    getSessionUserDid(request),
    getSessionAgent(request),
  ]);
  if (!userDid || !agent) {
    return { error: t("delete.invalid-session-error-message") };
  }
  try {
    await agent.deleteBoard();
  } catch (error) {
    logger.error("PDSからボードの削除に失敗しました", { error });
  }
  await boardService.deleteBoard(userDid);
  return redirect(`/`);
}
