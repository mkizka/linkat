import { data, redirect } from "react-router";

import { di } from "~/server/di";
import { createLogger } from "~/utils/logger";

import type { Route } from "./+types/sync";

const logger = createLogger("sync");

export async function action({ request }: Route.ActionArgs) {
  const editorDid = await di.sessionService.getSessionDid(request);
  if (!editorDid) {
    throw redirect("/login");
  }
  try {
    await di.boardEventService.syncEditor(editorDid);
  } catch (error) {
    logger.error(error, "同期に失敗しました");
    return data({ ok: false }, { status: 500 });
  }
  return { ok: true };
}
