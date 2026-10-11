import { useFormMetadata } from "@conform-to/react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

import { Card } from "~/components/card";
import { cardModal } from "~/features/board/form/card-form-modal";
import type { CardFormPayload } from "~/features/board/form/card-form-provider";
import type { ValidCard } from "~/models/card";
import { cn } from "~/utils/cn";

import { BlueskyEmbed } from "./bluesky-embed";
import { BlueskyFeed } from "./bluesky-feed";
import type { ParsedLinkCard, ParsedTextCard } from "./parser";
import { parseCard } from "./parser";

type CardContentProps = {
  parsed: ReturnType<typeof parseCard>;
};

function TextCardContent({
  parsed,
}: {
  parsed: ParsedLinkCard | ParsedTextCard;
}) {
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

function CardContent({ parsed }: CardContentProps) {
  if (parsed.type === "feed") {
    return <BlueskyFeed feedUri={parsed.feedUri} url={parsed.url} />;
  }
  if (parsed.type === "embed") {
    return <BlueskyEmbed blueskyUri={parsed.blueskyUri} />;
  }
  return (
    <div className="card-body flex-row items-center gap-2">
      <TextCardContent parsed={parsed} />
    </div>
  );
}

type EditableCardProps = {
  card: SortableCardProps["card"];
  parsed: ReturnType<typeof parseCard>;
  isDragging?: boolean;
};

function EditableCard({ card, parsed, isDragging }: EditableCardProps) {
  const form = useFormMetadata<CardFormPayload>();

  const handleOpen = () => {
    form.update({ name: "text", value: card.text });
    form.update({ name: "url", value: card.url });
    form.update({ name: "emoji", value: card.emoji });
    form.update({ name: "id", value: card.id });
    cardModal.open();
  };

  const handle = (
    <div
      className="flex size-10 shrink-0 cursor-grab items-center justify-center text-base-content/50 select-none"
      data-movable-handle
    >
      ⋮⋮
    </div>
  );
  const editButton = (
    <button
      type="button"
      className="btn btn-square btn-ghost"
      data-testid="sortable-card__edit"
      onClick={handleOpen}
    >
      <PencilSquareIcon className="size-6" />
    </button>
  );

  return (
    <Card
      className={cn({
        "animate-in zoom-in-100 scale-[103%]": isDragging,
      })}
    >
      {parsed.type === "feed" || parsed.type === "embed" ? (
        <>
          <div className="flex items-center justify-between px-2 pt-2">
            {handle}
            {editButton}
          </div>
          <div className="pointer-events-none">
            <CardContent parsed={parsed} />
          </div>
        </>
      ) : (
        <div className="card-body flex-row items-center gap-2 px-2 py-4">
          {handle}
          <TextCardContent parsed={parsed} />
          {editButton}
        </div>
      )}
    </Card>
  );
}

type SortableCardProps = {
  card: ValidCard & { id: string };
  isDragging?: boolean;
  sortable?: boolean;
};

export function SortableCard({
  card,
  sortable,
  isDragging,
}: SortableCardProps) {
  const parsed = parseCard(card);

  if (sortable) {
    return <EditableCard card={card} parsed={parsed} isDragging={isDragging} />;
  }
  if (parsed.type === "link") {
    return (
      <a
        href={card.url}
        target="_blank"
        rel="noreferrer"
        className="relative block"
        data-umami-event="click-card-link"
      >
        <Card>
          <CardContent parsed={parsed} />
        </Card>
      </a>
    );
  }
  return (
    <Card>
      <CardContent parsed={parsed} />
    </Card>
  );
}
