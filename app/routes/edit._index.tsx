import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { boardService } from "~/.server/service/boardService";
import { BoardEditor } from "~/features/edit/board-editor";
import type { ValidBoard } from "~/models/board";

const defaultBoard: ValidBoard = {
  cards: [
    {
      text: "1. URLあり",
      url: "https://example.com/1",
    },
    {
      text: "2. URLなし",
    },
    {
      text: "https://example.com/3",
      url: "https://example.com/3",
    },
  ],
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
  return <BoardEditor initialBoard={board} />;
}
