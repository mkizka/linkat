import { LinkIcon } from "@heroicons/react/24/outline";
import { forwardRef } from "react";

import { Card } from "~/components/card";
import type { ValidCard } from "~/models/card";

export type SortableCardProps = {
  card: ValidCard & { id: string };
};

export const SortableCard = forwardRef<HTMLDivElement, SortableCardProps>(
  ({ card }, ref) => (
    <Card
      className="pointer-events-none select-none"
      ref={ref}
      data-testid={`sortable-card__${card.id}`}
    >
      <div className="card-body flex-row items-center gap-4">
        <LinkIcon className="size-8" />
        <p className="flex-1 truncate">{card.text || card.url}</p>
      </div>
    </Card>
  ),
);

SortableCard.displayName = "SortableCard";
