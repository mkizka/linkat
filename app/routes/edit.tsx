import { data, redirect } from "react-router";
import { setToast } from "remix-toast/middleware";

import { SyncGate } from "~/features/sync/sync-gate";
import { useSync } from "~/features/sync/use-sync";
import { getInstance } from "~/i18n/i18n";
import { EditPage } from "~/pages/edit-page";
import { boardSchema } from "~/schemas/board";
import { di } from "~/server/di";
import { tryCatch } from "~/utils/tryCatch";

import type { Route } from "./+types/edit";

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
  const result = await di.boardEventService.handleEditorSave(
    editorDid,
    parsed.cards,
  );
  switch (result.type) {
    case "not-synced":
      return redirect("/");
    case "pds-failed":
      setToast(context, {
        message: i18next.t("edit.save-board-error-message"),
        type: "error",
      });
      return null;
    case "db-failed":
      setToast(context, {
        message: i18next.t("edit.save-delayed-warning-message"),
        type: "warning",
      });
      return redirect(`/${result.editor.handleOrDid}`);
    case "saved":
      return redirect(`/${result.editor.handleOrDid}?success`);
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const editorDid = await di.sessionService.getSessionDid(request);
  if (!editorDid) {
    throw redirect("/login");
  }
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
