import { z } from "zod";

export const moderationLevelSchema = z.enum(["unlisted", "hidden"]);

export type ModerationLevel = z.infer<typeof moderationLevelSchema>;
