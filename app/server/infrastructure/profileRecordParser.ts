import { getBlobCidString, l } from "@atproto/lex";

import type { Profile } from "~/models/owner";

export interface IProfileRecordParser {
  parse: (record: unknown) => Profile | null;
}

const profileSchema = l.object({
  displayName: l.optional(l.string()),
  description: l.optional(l.string()),
  avatar: l.optional(l.blob()),
});

export const profileRecordParserFactory = (): IProfileRecordParser => ({
  parse(record) {
    const result = profileSchema.safeParse(record);
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
