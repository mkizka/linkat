import type { Did } from "@atproto/did";
import { useEffect } from "react";
import { redirect, useFetcher } from "react-router";
import { setToast } from "remix-toast/middleware";

import { getInstance } from "~/i18n/i18n";
import { Board } from "~/models/board";
import { ownerViewFromDid } from "~/models/owner";
import { EditPage } from "~/pages/edit-page";
import { di } from "~/server/di";
import {
  BoardDbSaveError,
  BoardPdsSaveError,
} from "~/server/service/board/boardEvent";
import { env } from "~/utils/env";
import { tryCatch } from "~/utils/tryCatch";

import type { Route } from "./+types/edit";
import type { action as syncAction } from "./sync";

const findEditorView = async (did: Did) =>
  (await di.ownerService.findOwner(did))?.toView() ?? ownerViewFromDid(did);

export async function action({ request, context }: Route.ActionArgs) {
  const logger = di.logger.child("edit");
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
    logger.warn("boardの形式が不正でした", { error: parsedBoard });
    setToast(context, {
      message: i18next.t("edit.invalid-form-error-message"),
      type: "error",
    });
    return null;
  }
  try {
    await di.boardEventService.handleEditorSave(parsedBoard);
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
      const editor = await findEditorView(editorDid);
      return redirect(`/${editor.handleOrDid}`);
    }
    throw error;
  }
  const editor = await findEditorView(editorDid);
  return redirect(`/${editor.handleOrDid}?success`);
}

export async function loader({ request }: Route.LoaderArgs) {
  const editorDid = await di.sessionService.getSessionDid(request);
  if (!editorDid) {
    throw redirect("/login");
  }
  const [editorView, board] = await Promise.all([
    findEditorView(editorDid),
    di.boardService.findBoard(editorDid),
  ]);
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

  const syncState =
    loaderData.board || (sync.state === "idle" && sync.data?.ok)
      ? "ready"
      : sync.state !== "idle" || !sync.data
        ? "loading"
        : "error";

  return (
    <EditPage
      {...loaderData}
      syncState={syncState}
      onRetrySync={() => void submitSync()}
    />
  );
}
