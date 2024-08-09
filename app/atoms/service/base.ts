import { atomWithStorage } from "jotai/utils";

export const lastLoginService = atomWithStorage<string | null>(
  "service",
  "https://bsky.social",
  undefined,
  {
    getOnInit: true,
  },
);
