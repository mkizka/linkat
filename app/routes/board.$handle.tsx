import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { boardService } from "~/.server/service/boardService";
import { BoardEditor } from "~/features/edit/board-editor";

export async function loader({ params }: LoaderFunctionArgs) {
  const board = await boardService.findOrFetchBoard(params.handle!);
  if (!board) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw new Response(null, { status: 404 });
  }
  return json({ board });
}

export default function Index() {
  const { board } = useLoaderData<typeof loader>();
  return <BoardEditor board={board} />;
}
