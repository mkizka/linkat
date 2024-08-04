import { z } from "zod";

import { cardSchema } from "./card";

export const boardScheme = z.object({
  id: z.string(), // record上ではself
  cards: cardSchema.array(),
});

export type ValidBoard = z.infer<typeof boardScheme>;
