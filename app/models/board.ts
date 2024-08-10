import { z } from "zod";

import { cardSchema } from "./card";

export const boardScheme = z
  .object({
    id: z.string(), // record上ではself
    content: z.string(),
  })
  .transform(({ content, ...data }) => {
    const cards = z.unknown().array().parse(JSON.parse(content));
    return {
      ...data,
      cards: cards.flatMap((card) => cardSchema.safeParse(card).data ?? []),
    };
  });

export type ValidBoard = z.infer<typeof boardScheme>;
