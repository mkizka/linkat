import { useAtomValue, useSetAtom } from "jotai";

import { userAtom } from "./base";
import { linkatAgentAtom } from "./read-only";
import { loginAtom, resumeSessionAtom } from "./write-only";

export const useUser = () => useAtomValue(userAtom);

export const useLogin = () => useSetAtom(loginAtom);

export const useResumeSession = () => useSetAtom(resumeSessionAtom);

export const useLinkatAgent = () => useAtomValue(linkatAgentAtom);
