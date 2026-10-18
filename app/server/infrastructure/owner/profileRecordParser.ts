import { getBlobCidString } from "@atproto/lex";

import profile from "~/generated/app/bsky/actor/profile";
import type { ProfileDto } from "~/server/infrastructure/owner/ownerDto";

export interface IProfileRecordParser {
  parse: (record: unknown) => ProfileDto | null;
}

export const profileRecordParserFactory = (): IProfileRecordParser => ({
  parse(record) {
    const result = profile.safeParse(record);
    if (!result.success) {
      return null;
    }
    return {
      avatarCid: getBlobCidString(result.value.avatar) ?? null,
      description: result.value.description ?? null,
      displayName: result.value.displayName ?? null,
    };
  },
});
