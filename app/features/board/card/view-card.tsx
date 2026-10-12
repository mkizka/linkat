import { Card } from "~/components/card";
import type { ValidCard } from "~/models/card";

import { BlueskyEmbed } from "./bluesky-embed";
import { BlueskyFeed } from "./bluesky-feed";
import { parseCard } from "./parser";

type CardContentProps = {
  parsed: ReturnType<typeof parseCard>;
};

export function CardContent({ parsed }: CardContentProps) {
  if (parsed.type === "feed") {
    return <BlueskyFeed feedUri={parsed.feedUri} url={parsed.url} />;
  }
  if (parsed.type === "embed") {
    return <BlueskyEmbed blueskyUri={parsed.blueskyUri} />;
  }
  return (
    <>
      {parsed.emoji ? (
        <div className="flex size-6 shrink-0 items-center justify-center text-xl">
          {parsed.emoji}
        </div>
      ) : (
        parsed.type === "link" && <parsed.icon className="size-6 shrink-0" />
      )}
      <p className="flex-1 truncate">{parsed.text}</p>
    </>
  );
}

export function ViewCard({ card }: { card: ValidCard }) {
  const parsed = parseCard(card);
  if (parsed.type === "embed") {
    return <CardContent parsed={parsed} />;
  }
  const content = (
    <Card>
      {parsed.type === "feed" ? (
        <CardContent parsed={parsed} />
      ) : (
        <div className="card-body flex-row items-center gap-2">
          <CardContent parsed={parsed} />
        </div>
      )}
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
