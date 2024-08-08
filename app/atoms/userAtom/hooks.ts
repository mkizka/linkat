import { useAtomValue, useSetAtom } from "jotai";

import { userAtom } from "./base";
import { loginAtom, resumeSessionAtom } from "./write-only";

export const useUser = () => useAtomValue(userAtom);

export const useLogin = () => useSetAtom(loginAtom);

export const useResumeSession = () => useSetAtom(resumeSessionAtom);
