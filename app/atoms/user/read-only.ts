import { atom } from "jotai";

import { LinkatAgent } from "~/libs/agent";

import { userAtom } from "./base";

export const linkatAgentAtom = atom((get) => {
  const user = get(userAtom);
  if (!user) {
    throw new Error("ログインしていません");
  }
  return new LinkatAgent({
    service: user.service,
    session: user.session,
  });
});
