import type { ValidCard } from "~/models/card";

export type CardWithId = ValidCard & { id: string };

export const withId = (card: ValidCard): CardWithId => ({
  ...card,
  id: crypto.randomUUID(),
});
