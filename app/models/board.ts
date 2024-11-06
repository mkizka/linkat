import { z } from "zod";

import { cardSchema } from "./card";

export const boardScheme = z.object({
  cards: z
    .unknown()
    .array()
    .transform((val) => {
      return val.filter((card) => cardSchema.safeParse(card).success);
    }),
});

export type ValidBoard = z.infer<typeof boardScheme>;
