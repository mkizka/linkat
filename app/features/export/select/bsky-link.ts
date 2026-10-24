import link from "~/generated/app/bsky/actor/link";
import type { BoardCard } from "~/schemas/board";

export const isBskyLinkCard = ({ url, text }: BoardCard) =>
  link.safeParse({
    $type: link.$type,
    url,
    title: text || undefined,
    createdAt: new Date().toISOString(),
  }).success;
