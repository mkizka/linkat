import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { redirect, useBeforeUnload, useBlocker } from "react-router";
import { setToast } from "remix-toast/middleware";

import { Main } from "~/components/layout";
import { BoardViewer } from "~/features/board/board-viewer";
import { useUmami } from "~/hooks/useUmami";
import { getInstance } from "~/i18n/i18n";
import { di } from "~/server/di";
import {
  BoardDbSaveError,
  BoardPdsSaveError,
} from "~/server/service/boardService/board";
import { env } from "~/utils/env";
import { createLogger } from "~/utils/logger";

import type { Route } from "./+types/edit";

const logger = createLogger("edit");

export async function action({ request, context }: Route.ActionArgs) {
  const i18next = getInstance(context);
  const agent = await di.sessionService.getSessionAgent(request);
  if (!agent) {
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
  const parsedBoard = await di.boardService.parseBoardFromForm(
    agent.assertDid,
    rawBoard,
  );
  if (parsedBoard instanceof Error) {
    logger.warn({ error: parsedBoard }, "boardの形式が不正でした");
    setToast(context, {
      message: i18next.t("edit.invalid-form-error-message"),
      type: "error",
    });
    return null;
  }
  const owner = await di.userService.syncOwner(agent.assertDid);
  try {
    await di.boardService.publishBoard(agent, parsedBoard);
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
      return redirect(`/${owner.toView().handleOrDid}`);
    }
    throw error;
  }
  return redirect(`/${owner.toView().handleOrDid}?success`);
}

export async function loader({ request }: Route.LoaderArgs) {
  const agent = await di.sessionService.getSessionAgent(request);
  if (!agent) {
    throw redirect("/login");
  }
  const [editor, board] = await Promise.all([
    di.userService.findEditor(agent),
    di.boardService.findBoard(agent.assertDid),
  ]);
  return {
    editor,
    board: board && { cards: board.cards },
    url: `${env.PUBLIC_URL}/${editor.handleOrDid}`,
  };
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const { editor, board, url } = loaderData;
  const { t } = useTranslation();
  const umami = useUmami();

  // 更新ボタンを押したりしたときに確認ダイアログを出す
  useBeforeUnload((event) => {
    umami.track("unload-edit");
    event.preventDefault();
  });

  // 戻るボタンを押したりしたときに確認ダイアログを出す
  const blocker = useBlocker(
    ({ currentLocation, nextLocation, historyAction }) =>
      // 保存ボタンを押したときの移動以外のとき
      (currentLocation.pathname !== nextLocation.pathname &&
        nextLocation.pathname !== `/${editor.handleOrDid}`) ||
      // /alice.testから/editに移動して戻るとき
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      historyAction === "POP",
  );

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (confirm(t("edit.confirm-leave-message"))) {
      umami.track("leave-edit", {
        action: "confirm",
      });
      blocker.proceed();
    } else {
      umami.track("leave-edit", {
        action: "cancel",
      });
      blocker.reset();
    }
  }, [t, blocker, umami]);

  return (
    <Main>
      <BoardViewer user={editor} board={board} url={url} editable />
    </Main>
  );
}
