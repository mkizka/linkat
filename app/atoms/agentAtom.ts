import { atom } from "jotai";

import type { LinkatAgent } from "~/.client/agent";

export const linkatAgentAtom = atom<LinkatAgent | null>(null);
