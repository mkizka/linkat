import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { boardService } from "~/.server/service/boardService";
import { userService } from "~/.server/service/userService";
import { BoardViewer } from "~/features/board/board-viewer";
import type { ValidBoard } from "~/models/board";
import { createLogger } from "~/utils/logger";

const defaultBoard: ValidBoard = {
  cards: [],
};

const logger = createLogger("edit");

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const base = url.searchParams.get("base");
  if (!base) {
    return redirect("/");
  }
  // この順で処理した場合ボードを持たない(=このサービスのユーザーでない)ユーザーの
  // データも作られてしまうが、一旦このままにしておく
  const user = await userService.findOrFetchUser({
    handleOrDid: base,
  });
  if (!user) {
    logger.debug("baseに指定されたユーザーの取得に失敗しました", { base });
    return redirect("/");
  }
  const board = await boardService.findOrFetchBoard(user.did);
  return json({ user, board: board ?? defaultBoard });
}

export default function Index() {
  const { user, board } = useLoaderData<typeof loader>();
  return <BoardViewer user={user} board={board} editable />;
}
