import { type Did, isDid } from "@atproto/did";
import { z } from "zod";

export const moderationLevelSchema = z.enum(["unlisted", "hidden"]);

export type ModerationLevel = z.infer<typeof moderationLevelSchema>;

export const moderationFormSchema = z.object({
  ownerDid: z.custom<Did>((val) => typeof val === "string" && isDid(val)),
  handle: z.string(),
  level: z
    .enum(["none", ...moderationLevelSchema.options])
    .transform((val) => (val === "none" ? null : val)),
});
