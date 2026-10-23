import link from "~/generated/app/bsky/actor/link";
import type { BoardCard } from "~/schemas/board";

export const MAX_BSKY_LINKS = 10;

export const toBskyLink = ({ url, text }: BoardCard) => {
  const result = link.safeParse({
    $type: link.$type,
    url,
    title: text || undefined,
    createdAt: new Date().toISOString(),
  });
  return result.success ? result.value : null;
};
