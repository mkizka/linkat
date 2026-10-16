import { data, redirect } from "react-router";
import { setToast } from "remix-toast/middleware";

import { getInstance } from "~/i18n/i18n";
import { ExportPage } from "~/pages/export-page";
import { di } from "~/server/di";
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
    const cards = await di.bskyLinkService.exportCards(editorDid, cardIndexes);
    logger.info("Blueskyにリンクを書き出しました", {
      ownerDid: editorDid,
      cardCount: cards.length,
    });
    return { exportedCards: cards };
  } catch (error) {
    if (error instanceof BskyLinkSelectionError) {
      setToast(context, {
        message: i18next.t("export.invalid-form-error-message"),
        type: "error",
      });
      return null;
    }
    logger.error("Blueskyへのリンクの書き出しに失敗しました", { error });
    setToast(context, {
      message: i18next.t("export.export-error-message"),
      type: "error",
    });
    return null;
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
      exportedCards={actionData?.exportedCards}
    />
  );
}
