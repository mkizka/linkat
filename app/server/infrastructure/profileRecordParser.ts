import { getBlobCidString, lexParse } from "@atproto/lex";

import profile from "~/generated/app/bsky/actor/profile";
import type { Profile } from "~/models/user";

export interface IProfileRecordParser {
  parse: (record: unknown) => Profile | null;
}

export const profileRecordParserFactory = (): IProfileRecordParser => ({
  parse(record) {
    try {
      const result = profile.safeParse(lexParse(JSON.stringify(record)));
      if (!result.success) {
        return null;
      }
      return {
        avatar: null,
        avatarCid: getBlobCidString(result.value.avatar) ?? null,
        description: result.value.description ?? null,
        displayName: result.value.displayName ?? null,
      };
    } catch {
      return null;
    }
  },
});
