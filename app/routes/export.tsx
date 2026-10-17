import { data, redirect } from "react-router";
import { setToast } from "remix-toast/middleware";

import { getInstance } from "~/i18n/i18n";
import { ExportPage } from "~/pages/export-page";
import { di } from "~/server/di";
import {
  BskyLinkCleanupError,
  BskyLinkConflictError,
  BskyLinkExportError,
} from "~/server/infrastructure/bskyLink/bskyLinkPdsRepository";
import { BskyLinkSelectionError } from "~/server/service/bskyLink/bskyLink";

import type { Route } from "./+types/export";

export async function action({ request, context }: Route.ActionArgs) {
  const logger = di.logger.child("export");
  const i18next = getInstance(context);
  const editorDid = await di.sessionService.getSessionDid(request);
  if (!editorDid) {
    setToast(context, {
      message: i18next.t("export.invalid-session-error-message"),
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
  const cardIndexes = form.getAll("index").map(Number);
  try {
    await di.bskyLinkService.exportCards(editorDid, cardIndexes);
    logger.info("Blueskyにリンクを書き出しました", {
      ownerDid: editorDid,
      cardCount: cardIndexes.length,
    });
    return { exported: true };
  } catch (error) {
    if (error instanceof BskyLinkSelectionError) {
      setToast(context, {
        message: i18next.t("export.invalid-form-error-message"),
        type: "error",
      });
      return null;
    }
    if (error instanceof BskyLinkExportError) {
      logger.error(error.message, { error });
      setToast(context, {
        message: i18next.t("export.export-error-message"),
        type: "error",
      });
      return null;
    }
    if (error instanceof BskyLinkConflictError) {
      logger.error(error.message, { error });
      setToast(context, {
        message: i18next.t("export.conflict-error-message"),
        type: "error",
      });
      return null;
    }
    if (error instanceof BskyLinkCleanupError) {
      logger.error(error.message, { error });
      setToast(context, {
        message: i18next.t("export.cleanup-warning-message"),
        type: "warning",
      });
      return { exported: true };
    }
    throw error;
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
  if (!board) {
    throw redirect("/");
  }
  return { handle: editor.handleOrDid, cards: board.cards };
}

export default function Export({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <ExportPage
      handle={loaderData.handle}
      cards={loaderData.cards}
      exported={actionData?.exported}
    />
  );
}
