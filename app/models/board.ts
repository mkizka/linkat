import { z } from "zod";

import { cardSchema } from "./card";

export const boardScheme = z.object({
  description: z.string().optional(),
  cards: z.array(cardSchema),
});

export type ValidBoard = z.infer<typeof boardScheme>;
