import { data, redirect } from "react-router";
import { setToast } from "remix-toast/middleware";

import { getInstance } from "~/i18n/i18n";
import { ExportPage } from "~/pages/export-page";
import { di } from "~/server/di";
import {
  BskyLinkCleanupError,
  BskyLinkConflictError,
  BskyLinkExportError,
  BskyLinkInvalidError,
} from "~/server/infrastructure/bskyLink/bskyLinkPdsRepository";
import { requireExperimental } from "~/server/middleware/requireExperimental";
import {
  editorDidContext,
  requireLogin,
} from "~/server/middleware/requireLogin";
import { BskyLinkSelectionError } from "~/server/service/bskyLink/bskyLink";

import type { Route } from "./+types/export";

export const middleware: Route.MiddlewareFunction[] = [
  requireLogin,
  requireExperimental,
];

export async function action({ request, context }: Route.ActionArgs) {
  const logger = di.logger.child("export");
  const i18next = getInstance(context);
  const editorDid = context.get(editorDidContext);
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
    if (
      error instanceof BskyLinkSelectionError ||
      error instanceof BskyLinkInvalidError
    ) {
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

export async function loader({ context }: Route.LoaderArgs) {
  const editorDid = context.get(editorDidContext);
  const [editor, board] = await Promise.all([
    di.ownerService.findEditorView(editorDid),
    di.boardService.findBoard(editorDid),
  ]);
  if (!board) {
    throw redirect("/");
  }
  return {
    handle: editor.handleOrDid,
    cards: board.cards,
    needsReauth: !(await di.authService.canExport(editorDid)),
  };
}

export default function Export({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <ExportPage
      handle={loaderData.handle}
      cards={loaderData.cards}
      needsReauth={loaderData.needsReauth}
      exported={actionData?.exported}
    />
  );
}
