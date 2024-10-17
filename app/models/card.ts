import { z } from "zod";

export const cardSchema = z.object({
  url: z.string().url().or(z.literal("")).optional(),
  text: z.string().optional(),
  emoji: z.string().regex(/^\p{Emoji}$/u),
});

export type ValidCard = z.infer<typeof cardSchema>;
