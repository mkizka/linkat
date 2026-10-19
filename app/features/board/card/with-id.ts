import type { BoardCard } from "~/schemas/board";

export type CardWithId = BoardCard & { id: string };

export const withId = (card: BoardCard): CardWithId => ({
  ...card,
  id: crypto.randomUUID(),
});
