import type { Did } from "@atproto/did";

import type { BoardCard } from "~/schemas/board";

export type Board = {
  ownerDid: Did;
  cards: BoardCard[];
};
