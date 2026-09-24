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

function redirectWithError(
  context: Route.ActionArgs["context"],
  message: string,
) {
  setToast(context, { message, type: "error" });
  return redirect("/edit");
}

export async function action({ request, context }: Route.ActionArgs) {
  const i18next = getInstance(context);
  const [user, agent] = await Promise.all([
    di.sessionService.getSessionUser(request),
    di.sessionService.getSessionAgent(request),
  ]);
  if (!user || !agent) {
    return redirectWithError(
      context,
      i18next.t("edit.invalid-session-error-message"),
    );
  }
  const form = await request.formData();
  const rawBoard = form.get("board");
  if (typeof rawBoard !== "string") {
    return redirectWithError(
      context,
      i18next.t("edit.invalid-form-error-message"),
    );
  }
  // 1. 楽観的にDBを更新
  const parsedBoard = await di.boardService.parseBoardFromForm(
    user.did,
    rawBoard,
  );
  if (parsedBoard instanceof Error) {
    logger.warn({ error: parsedBoard }, "boardの形式が不正でした");
    return redirectWithError(
      context,
      i18next.t("edit.invalid-form-error-message"),
    );
  }
  await di.boardService.saveBoard(parsedBoard);
  try {
    // 2. PDSにも保存
    await agent.updateBoard(parsedBoard);
  } catch (error) {
    logger.error(error, "PDSへのボードの保存に失敗しました");
  }
  // 3. 閲覧ページにリダイレクト
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
