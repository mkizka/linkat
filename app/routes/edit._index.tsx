import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect, useLoaderData } from "@remix-run/react";

import { BoardViewer } from "~/features/board/board-viewer";
import { getSessionUser } from "~/server/oauth/session";
import { boardService } from "~/server/service/boardService";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getSessionUser(request);
  if (!user) {
    return redirect("/login");
  }
  const board = await boardService.findOrFetchBoard(user.did);
  return { user, board: board ?? { cards: [] } };
}

export default function Index() {
  const { user, board } = useLoaderData<typeof loader>();
  return <BoardViewer user={user} board={board} editable />;
}
