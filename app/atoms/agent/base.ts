import { atom } from "jotai";

import type { LinkatAgent } from "~/libs/agent";
import { required } from "~/utils/required";

const baseAtom = atom<LinkatAgent | null>(null);

export const linkatAgentAtom = atom(
  (get) => required(get(baseAtom)),
  (_, set, agent: LinkatAgent) => set(baseAtom, agent),
);
