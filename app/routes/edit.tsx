import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect, useLoaderData } from "@remix-run/react";

import { BoardViewer } from "~/features/board/board-viewer";
import { RouteToaster } from "~/features/toast/route";
import { boardScheme } from "~/models/board";
import { getSessionAgent, getSessionUser } from "~/server/oauth/session";
import { boardService } from "~/server/service/boardService";
import { createLogger } from "~/utils/logger";

const logger = createLogger("edit");

export async function action({ request }: ActionFunctionArgs) {
  const [user, agent] = await Promise.all([
    getSessionUser(request),
    getSessionAgent(request),
  ]);
  if (!user || !agent) {
    return { error: "ログインしてください" };
  }
  const form = await request.formData();
  const rawBoard = form.get("board");
  if (typeof rawBoard !== "string") {
    return { error: "ボードの保存に失敗しました" };
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
  return redirect(`/board/${user.handle}`);
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
      <BoardViewer user={user} board={board} editable />
      <RouteToaster />
    </>
  );
}
