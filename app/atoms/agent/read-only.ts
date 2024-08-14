import { atom } from "jotai";

import { required } from "~/utils/required";

import { linkatAgentAtom } from "./base";

export const loginLinkatAgentAtom = atom((get) => {
  const agent = get(linkatAgentAtom);
  return required(agent);
});
