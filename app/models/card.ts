import { z } from "zod";

export const cardSchema = z.object({
  id: z.string(), // record上ではTID
  url: z.string().url().optional(),
  text: z.string().optional(),
});

export type ValidCard = z.infer<typeof cardSchema>;
