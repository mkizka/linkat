import { useAtom } from "jotai";

import { lastLoginService } from "./base";

export const useLastLoginService = () => useAtom(lastLoginService);
