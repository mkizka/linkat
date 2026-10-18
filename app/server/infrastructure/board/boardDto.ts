import type { Did } from "@atproto/did";

import type { BoardCard } from "~/schemas/board";

export type BoardDto = {
  ownerDid: Did;
  cards: BoardCard[];
};
