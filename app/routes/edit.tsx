import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  redirect,
  useBeforeUnload,
  useBlocker,
  useLoaderData,
} from "@remix-run/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Main } from "~/components/layout";
import { BoardViewer } from "~/features/board/board-viewer";
import { RouteToaster } from "~/features/toast/route";
import { i18nServer } from "~/i18n/i18n";
import { boardScheme } from "~/models/board";
import { getSessionAgent, getSessionUser } from "~/server/oauth/session";
import { boardService } from "~/server/service/boardService";
import { env } from "~/utils/env";
import { createLogger } from "~/utils/logger";

const logger = createLogger("edit");

export async function action({ request }: ActionFunctionArgs) {
  const t = await i18nServer.getFixedT(request);
  const [user, agent] = await Promise.all([
    getSessionUser(request),
    getSessionAgent(request),
  ]);
  if (!user || !agent) {
    return { error: t("login.invalid-session-error-message") };
  }
  const form = await request.formData();
  const rawBoard = form.get("board");
  if (typeof rawBoard !== "string") {
    return { error: t("edit.invalid-form-error-message") };
  }
  // 1. 楽観的にDBを更新
  const parsedBoard = boardScheme.parse(JSON.parse(rawBoard));
  await boardService.createOrUpdateBoard({
    userDid: user.did,
    board: parsedBoard,
  });
  try {
    // 2. PDSにも保存
    await agent.updateBoard(parsedBoard);
  } catch (error) {
    logger.error("PDSへのボードの保存に失敗しました", { error });
  }
  // 3. 閲覧ページにリダイレクト
  return redirect(`/${user.handle}?success`);
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getSessionUser(request);
  if (!user) {
    return redirect("/login");
  }
  const board = await boardService.findOrFetchBoard(user.did);
  return { user, board, url: `${env.PUBLIC_URL}/${user.handle}` };
}

export default function Index() {
  const { user, board, url } = useLoaderData<typeof loader>();
  const { t } = useTranslation();

  // 更新ボタンを押したりしたときに確認ダイアログを出す
  useBeforeUnload((event) => {
    void umami.track("unload-edit");
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
      void umami.track("leave-edit", {
        action: "confirm",
      });
      blocker.proceed();
    } else {
      void umami.track("leave-edit", {
        action: "cancel",
      });
      blocker.reset();
    }
  }, [t, blocker]);

  return (
    <>
      <Main>
        <BoardViewer user={user} board={board} url={url} editable />
      </Main>
      <RouteToaster />
    </>
  );
}
