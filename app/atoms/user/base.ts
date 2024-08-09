import type { AppBskyActorDefs, AtpSessionData } from "@atproto/api";
import { atomWithStorage } from "jotai/utils";

type UserState = {
  profile: AppBskyActorDefs.ProfileViewDetailed;
  session: AtpSessionData;
  service: string;
};

export const userAtom = atomWithStorage<UserState | null>(
  "user",
  null,
  undefined,
  {
    getOnInit: true,
  },
);
