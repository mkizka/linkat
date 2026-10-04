import { redirect } from "react-router";
import { setToast } from "remix-toast/middleware";

import { getInstance } from "~/i18n/i18n";
import { di } from "~/server/di";
import {
  BoardDbDeleteError,
  BoardPdsDeleteError,
} from "~/server/service/boardEventService/boardEvent";
import { createLogger } from "~/utils/logger";

import type { Route } from "./+types/delete";

const logger = createLogger("delete");

export async function action({ request, context }: Route.ActionArgs) {
  const i18next = getInstance(context);
  const [ownerDid, agent] = await Promise.all([
    di.sessionService.getSessionDid(request),
    di.sessionService.getSessionAgent(request),
  ]);
  if (!ownerDid || !agent) {
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
    await di.boardEventService.unpublishBoard(agent, ownerDid);
  } catch (error) {
    if (error instanceof BoardPdsDeleteError) {
      logger.error(error, error.message);
      setToast(context, {
        message: i18next.t("delete.delete-board-error-message"),
        type: "error",
      });
      return redirect("/settings");
    }
    if (error instanceof BoardDbDeleteError) {
      logger.error(error, error.message);
      setToast(context, {
        message: i18next.t("delete.delete-delayed-warning-message"),
        type: "warning",
      });
      return redirect("/");
    }
    throw error;
  }
  return redirect("/");
}
