import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect, useActionData, useLoaderData } from "@remix-run/react";
import { useEffect } from "react";

import { useToast } from "~/atoms/toast/hooks";
import { BoardViewer } from "~/features/board/board-viewer";
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
  const actionData = useActionData<typeof action>();
  const toast = useToast();

  useEffect(() => {
    if (actionData) {
      toast.error(actionData.error);
    }
  }, [toast, actionData]);

  return <BoardViewer user={user} board={board} editable />;
}
