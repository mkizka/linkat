import { atom } from "jotai";

import type { LinkatAgent } from "~/libs/agent";

export const linkatAgentAtom = atom<LinkatAgent | null>(null);
