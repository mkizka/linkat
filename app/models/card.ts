import { z } from "zod";

export const cardSchema = z.object({
  url: z.string().url().or(z.literal("")).optional(),
  text: z.string().optional(),
});

export type ValidCard = z.infer<typeof cardSchema>;
