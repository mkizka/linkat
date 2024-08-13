import { atom, useSetAtom } from "jotai";

import { userAtom } from "~/atoms/user/base";
import { LinkatAgent } from "~/libs/agent";
import type { ValidCard } from "~/models/card";

const updateBoardAtom = atom(null, async (get, set, cards: ValidCard[]) => {
  const user = get(userAtom);
  if (!user) {
    throw new Error("ログインが必要です");
  }
  const agent = new LinkatAgent({
    service: user.service,
    session: user.session,
  });
  await agent.updateBoard({ cards });
});

export const useUpdateBoard = () => useSetAtom(updateBoardAtom);
