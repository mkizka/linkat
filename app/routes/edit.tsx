import { data, redirect } from "react-router";
import { setToast } from "remix-toast/middleware";

import { SyncGate } from "~/features/sync/sync-gate";
import { useSync } from "~/features/sync/use-sync";
import { getInstance } from "~/i18n/i18n";
import { EditPage } from "~/pages/edit-page";
import { boardSchema } from "~/schemas/board";
import { di } from "~/server/di";
import {
  editorDidContext,
  requireLogin,
} from "~/server/middleware/requireLogin";
import {
  BoardDbSaveError,
  BoardPdsSaveError,
} from "~/server/service/board/boardEvent";
import { tryCatch } from "~/utils/tryCatch";

import type { Route } from "./+types/edit";

export const middleware: Route.MiddlewareFunction[] = [requireLogin];

export async function action({ request, context }: Route.ActionArgs) {
  const logger = di.logger.child("edit");
  const i18next = getInstance(context);
  const editorDid = context.get(editorDidContext);
  const editor = await di.ownerService.findEditorView(editorDid);
  if (!editor.synced) {
    return redirect("/");
  }
  const form = await request.formData().catch(() => {
    throw data(null, { status: 400 });
  });
  const rawBoard = form.get("board");
  if (typeof rawBoard !== "string") {
    setToast(context, {
      message: i18next.t("edit.invalid-form-error-message"),
      type: "error",
    });
    return null;
  }
  const parsed = await tryCatch(() =>
    boardSchema.parse(JSON.parse(rawBoard)),
  )();
  if (parsed instanceof Error) {
    logger.warn("boardの形式が不正でした", { error: parsed });
    setToast(context, {
      message: i18next.t("edit.invalid-form-error-message"),
      type: "error",
    });
    return null;
  }
  const board = { ownerDid: editorDid, cards: parsed.cards };
  try {
    await di.boardEventService.handleEditorSave(board);
  } catch (error) {
    if (error instanceof BoardPdsSaveError) {
      logger.error(error.message, { error });
      setToast(context, {
        message: i18next.t("edit.save-board-error-message"),
        type: "error",
      });
      return null;
    }
    if (error instanceof BoardDbSaveError) {
      logger.error(error.message, { error });
      setToast(context, {
        message: i18next.t("edit.save-delayed-warning-message"),
        type: "warning",
      });
      return redirect(`/${editor.handleOrDid}`);
    }
    throw error;
  }
  logger.info("ボードを保存しました", {
    ownerDid: editorDid,
    cardCount: board.cards.length,
  });
  return redirect(`/${editor.handleOrDid}?success`);
}

export async function loader({ context }: Route.LoaderArgs) {
  const editorDid = context.get(editorDidContext);
  const [editor, board] = await Promise.all([
    di.ownerService.findEditorView(editorDid),
    di.boardService.findBoard(editorDid),
  ]);
  if (!editor.synced) {
    throw redirect("/");
  }
  return {
    editor,
    board: board && { cards: board.cards },
  };
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const sync = useSync(!loaderData.board);
  return (
    <SyncGate state={sync.state} onRetry={sync.retry}>
      <EditPage {...loaderData} />
    </SyncGate>
  );
}
