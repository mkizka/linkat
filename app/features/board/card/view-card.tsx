import { Card } from "~/components/card";
import type { BoardCard } from "~/schemas/board";

import { CardContent } from "./card-content";
import { parseCard } from "./parser";

type Props = {
  card: BoardCard;
};

export function ViewCard({ card }: Props) {
  const parsed = parseCard(card);
  if (parsed.type === "embed") {
    return <CardContent parsed={parsed} />;
  }
  const content = (
    <Card>
      <div className="card-body">
        <CardContent parsed={parsed} />
      </div>
    </Card>
  );
  if (card.url) {
    return (
      <a
        href={card.url}
        target="_blank"
        rel="noreferrer"
        className="relative block"
        data-umami-event="click-card-link"
      >
        {content}
      </a>
    );
  }
  return content;
}
