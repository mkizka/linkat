import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { redirect, useBeforeUnload, useBlocker } from "react-router";
import { setToast } from "remix-toast/middleware";

import { Main } from "~/components/layout";
import { BoardViewer } from "~/features/board/board-viewer";
import { useUmami } from "~/hooks/useUmami";
import { getInstance } from "~/i18n/i18n";
import { di } from "~/server/di";
import { env } from "~/utils/env";
import { createLogger } from "~/utils/logger";

import type { Route } from "./+types/edit";

const logger = createLogger("edit");

export async function action({ request, context }: Route.ActionArgs) {
  const i18next = getInstance(context);
  const [user, agent] = await Promise.all([
    di.sessionService.getSessionUser(request),
    di.sessionService.getSessionAgent(request),
  ]);
  if (!user || !agent) {
    setToast(context, {
      message: i18next.t("edit.invalid-session-error-message"),
      type: "error",
    });
    return null;
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
    user.did,
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
  try {
    await agent.updateBoard(parsedBoard);
  } catch (error) {
    logger.error(error, "PDSへのボードの保存に失敗しました");
    setToast(context, {
      message: i18next.t("edit.save-board-error-message"),
      type: "error",
    });
    return null;
  }
  // Jetstreamより先に閲覧ページへ反映するためDBも更新
  try {
    await di.boardService.saveBoard(parsedBoard);
  } catch (error) {
    // PDSには保存できておりJetstream経由でいずれDBにも反映されるため、警告を出して閲覧ページへ移動する
    logger.error(error, "DBへのボードの保存に失敗しました");
    setToast(context, {
      message: i18next.t("edit.save-delayed-warning-message"),
      type: "warning",
    });
    return redirect(`/${user.handle}`);
  }
  return redirect(`/${user.handle}?success`);
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await di.sessionService.getSessionUser(request);
  if (!user) {
    throw redirect("/login");
  }
  const board = await di.boardService.findOrFetchBoard(user.did);
  return {
    user,
    board: board && { cards: board.cards },
    url: `${env.PUBLIC_URL}/${user.handle}`,
  };
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const { user, board, url } = loaderData;
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
        nextLocation.pathname !== `/${user.handle}`) ||
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
      <BoardViewer user={user} board={board} url={url} editable />
    </Main>
  );
}
