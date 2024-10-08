import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect, useLoaderData } from "@remix-run/react";

import { Main } from "~/components/layout";
import { BoardViewer } from "~/features/board/board-viewer";
import { RouteToaster } from "~/features/toast/route";
import { i18nServer } from "~/i18n/i18n";
import { boardScheme } from "~/models/board";
import { getSessionAgent, getSessionUser } from "~/server/oauth/session";
import { boardService } from "~/server/service/boardService";
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
  return redirect(`/${user.handle}`);
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getSessionUser(request);
  if (!user) {
    return redirect("/login");
  }
  const board = await boardService.findOrFetchBoard(user.did);
  return { user, board };
}

export default function Index() {
  const { user, board } = useLoaderData<typeof loader>();

  return (
    <>
      <Main>
        <BoardViewer user={user} board={board} editable />
      </Main>
      <RouteToaster />
    </>
  );
}
