import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { boardService } from "~/.server/service/boardService";
import { BoardEditor } from "~/features/edit/board-editor";
import type { ValidBoard } from "~/models/board";

const defaultBoard: ValidBoard = {
  cards: [],
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const base = url.searchParams.get("base");
  if (!base) {
    return redirect("/");
  }
  const board = await boardService.findOrFetchBoard(base);
  return json({ board: board ?? defaultBoard });
}

export default function Index() {
  const { board } = useLoaderData<typeof loader>();
  return <BoardEditor board={board} editable />;
}
