import { getBlobCidString } from "@atproto/lex";

import profile from "~/generated/app/bsky/actor/profile";
import type { Profile } from "~/models/user";

export interface IProfileRecordParser {
  parse: (record: unknown) => Profile | null;
}

export const profileRecordParserFactory = (): IProfileRecordParser => ({
  parse(record) {
    const result = profile.safeParse(record);
    if (!result.success) {
      return null;
    }
    return {
      avatar: null,
      avatarCid: getBlobCidString(result.value.avatar) ?? null,
      description: result.value.description ?? null,
      displayName: result.value.displayName ?? null,
    };
  },
});
