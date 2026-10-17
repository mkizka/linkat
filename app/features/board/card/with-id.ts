import type { BoardCard } from "~/models/board";

export type CardWithId = BoardCard & { id: string };

export const withId = (card: BoardCard): CardWithId => ({
  ...card,
  id: crypto.randomUUID(),
});
