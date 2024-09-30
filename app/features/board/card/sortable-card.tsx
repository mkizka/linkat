import { useFormMetadata } from "@conform-to/react";
import {
  ArrowsUpDownIcon,
  LinkIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";

import { Card } from "~/components/card";
import { cardModal } from "~/features/board/form/card-form-modal";
import type { ValidCard } from "~/models/card";
import { cn } from "~/utils/cn";

import { BlueskyEmbed } from "./bluesky-embed";
import { parseCard } from "./parser";

type CardContentProps = {
  parsed: ReturnType<typeof parseCard>;
};

function CardContent({ parsed }: CardContentProps) {
  if (parsed.type === "embed") {
    return <BlueskyEmbed blueskyUri={parsed.blueskyUri} />;
  }
  return (
    <div className="card-body flex-row items-center gap-2">
      {parsed.type === "link" && <LinkIcon className="-ml-2 size-6" />}
      <p className="flex-1 truncate">{parsed.text}</p>
    </div>
  );
}

type CardBodyProps = {
  parsed: ReturnType<typeof parseCard>;
  isDragging?: boolean;
};

function CardBody({ parsed, isDragging }: CardBodyProps) {
  return (
    <Card
      className={cn({
        "ring ring-neutral animate-in zoom-in-100 scale-[103%]": isDragging,
      })}
    >
      <CardContent parsed={parsed} />
    </Card>
  );
}

export type SortableCardProps = {
  card: ValidCard & { id: string };
  isDragging?: boolean;
  sortable?: boolean;
};

export function SortableCard({
  card,
  sortable,
  isDragging,
}: SortableCardProps) {
  const form = useFormMetadata();
  const parsed = parseCard(card);

  const handleOpen = () => {
    form.update({ name: "text", value: card.text });
    form.update({ name: "url", value: card.url });
    form.update({ name: "id", value: card.id });
    cardModal.open();
  };

  if (parsed.type === "link" && !sortable) {
    return (
      <a
        href={card.url}
        target="_blank"
        rel="noreferrer"
        className="relative block"
      >
        <CardBody parsed={parsed} isDragging={isDragging} />
      </a>
    );
  }
  return (
    <article className="relative">
      {sortable && <div className="absolute z-10 size-full" />}
      <CardBody parsed={parsed} isDragging={isDragging} />
      {sortable && !isDragging && (
        <div className="absolute right-2 top-2 z-20 flex gap-2">
          <button className="btn btn-square" data-movable-handle>
            <ArrowsUpDownIcon className="size-6" />
          </button>
          <button
            className="btn btn-square"
            data-testid={`sortable-card__edit`}
            onClick={handleOpen}
          >
            <PencilSquareIcon className="size-6" />
          </button>
        </div>
      )}
    </article>
  );
}
