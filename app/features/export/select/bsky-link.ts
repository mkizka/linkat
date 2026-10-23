import type { BoardCard } from "~/schemas/board";
import { toBskyLink } from "~/schemas/bskyLink";

export const isBskyLinkCard = (card: BoardCard) => toBskyLink(card) !== null;
