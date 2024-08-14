import { useAtomValue } from "jotai";

import { linkatAgentAtom } from "./base";

export const useLinkatAgent = () => useAtomValue(linkatAgentAtom);
