import { atomWithStorage } from "jotai/utils";

export const lastLoginService = atomWithStorage<string | null>(
  "service",
  null,
  undefined,
  {
    getOnInit: true,
  },
);
