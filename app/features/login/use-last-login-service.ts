import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const lastLoginService = atomWithStorage<string | null>(
  "service",
  "https://bsky.social",
  undefined,
  {
    getOnInit: true,
  },
);

export const useLastLoginService = () => useAtom(lastLoginService);
