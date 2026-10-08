import { useEffect } from "react";
import { redirect, useFetcher } from "react-router";
import { setToast } from "remix-toast/middleware";

import { Editor } from "~/features/edit/editor";
import { SyncError, SyncLoading } from "~/features/edit/sync-status";
import { getInstance } from "~/i18n/i18n";
import { Board } from "~/models/board";
import { di } from "~/server/di";
import {
  BoardDbSaveError,
  BoardPdsSaveError,
} from "~/server/service/boardEventService/boardEvent";
import { env } from "~/utils/env";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

import type { Route } from "./+types/edit";
import type { action as syncAction } from "./sync";

const logger = createLogger("edit");

export async function action({ request, context }: Route.ActionArgs) {
  const i18next = getInstance(context);
  const editorDid = await di.sessionService.getSessionDid(request);
  if (!editorDid) {
    setToast(context, {
      message: i18next.t("edit.invalid-session-error-message"),
      type: "error",
    });
    return redirect("/login", {
      headers: {
        "Set-Cookie": await di.sessionService.destroySession(request),
      },
    });
  }
  const form = await request.formData();
  const rawBoard = form.get("board");
  if (typeof rawBoard !== "string") {
    setToast(context, {
      message: i18next.t("edit.invalid-form-error-message"),
      type: "error",
    });
    return null;
  }
  const parsedBoard = await tryCatch(() =>
    Board.fromRecord(editorDid, JSON.parse(rawBoard)),
  )();
  if (parsedBoard instanceof Error) {
    logger.warn({ error: parsedBoard }, "boardの形式が不正でした");
    setToast(context, {
      message: i18next.t("edit.invalid-form-error-message"),
      type: "error",
    });
    return null;
  }
  try {
    await di.boardEventService.publishBoard(parsedBoard);
  } catch (error) {
    if (error instanceof BoardPdsSaveError) {
      logger.error(error, error.message);
      setToast(context, {
        message: i18next.t("edit.save-board-error-message"),
        type: "error",
      });
      return null;
    }
    if (error instanceof BoardDbSaveError) {
      logger.error(error, error.message);
      setToast(context, {
        message: i18next.t("edit.save-delayed-warning-message"),
        type: "warning",
      });
      const editor = (await di.ownerService.findOwner(editorDid)).toView();
      return redirect(`/${editor.handleOrDid}`);
    }
    throw error;
  }
  const editor = (await di.ownerService.findOwner(editorDid)).toView();
  return redirect(`/${editor.handleOrDid}?success`);
}

export async function loader({ request }: Route.LoaderArgs) {
  const editorDid = await di.sessionService.getSessionDid(request);
  if (!editorDid) {
    throw redirect("/login");
  }
  const [editor, board] = await Promise.all([
    di.ownerService.findOwner(editorDid),
    di.boardService.findBoard(editorDid),
  ]);
  const editorView = editor.toView();
  return {
    editor: editorView,
    board: board && { cards: board.cards },
    url: `${env.PUBLIC_URL}/${editorView.handleOrDid}`,
  };
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const sync = useFetcher<typeof syncAction>();
  const submitSync = () =>
    sync.submit(null, { method: "post", action: "/sync" });

  useEffect(() => {
    if (!loaderData.board && sync.state === "idle" && !sync.data) {
      void submitSync();
    }
  });

  if (loaderData.board || (sync.state === "idle" && sync.data?.ok)) {
    return <Editor {...loaderData} />;
  }
  if (sync.state !== "idle" || !sync.data) {
    return <SyncLoading />;
  }
  return <SyncError onRetry={() => void submitSync()} />;
}
