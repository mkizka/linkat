import { redirect, useLoaderData } from "@remix-run/react";
import { getDefaultStore } from "jotai";

import { linkatAgentAtom } from "~/atoms/agent/base";
import { useUser } from "~/atoms/user/hooks";
import { resumeSessionAtom } from "~/atoms/user/write-only";
import { BoardViewer } from "~/features/board/board-viewer";
import { tryCatch } from "~/utils/tryCatch";

export async function clientLoader() {
  const store = getDefaultStore();
  await store.set(resumeSessionAtom);
  const agent = store.get(linkatAgentAtom);
  if (!agent) {
    return redirect("/");
  }
  const board = await tryCatch(agent.getSessionBoard.bind(agent))();
  if (board instanceof Error) {
    return { board: null };
  }
  return { board: board.value };
}

export default function Index() {
  const user = useUser();
  const { board } = useLoaderData<typeof clientLoader>();
  if (!user) return null;
  return (
    <BoardViewer
      // TODO: atom側に移す
      user={{
        did: user.profile.did,
        handle: user.profile.handle,
        displayName: user.profile.displayName ?? null,
        avatar: user.profile.avatar ?? null,
      }}
      board={board}
      editable
    />
  );
}
