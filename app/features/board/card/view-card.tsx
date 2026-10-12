import { Card } from "~/components/card";
import type { ValidCard } from "~/models/card";

import { CardContent } from "./card-content";
import { parseCard } from "./parser";

export function ViewCard({ card }: { card: ValidCard }) {
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
  if (parsed.type === "link") {
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
