import { useFormMetadata } from "@conform-to/react";
import { LinkIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { forwardRef } from "react";

import { Card } from "~/components/card";
import { cardModal } from "~/features/board/form/card-form-modal";
import type { ValidCard } from "~/models/card";
import { cn } from "~/utils/cn";

export type SortableCardProps = {
  card: ValidCard & { id: string };
  isDragging?: boolean;
  sortable?: boolean;
};

export const SortableCard = forwardRef<HTMLDivElement, SortableCardProps>(
  ({ card, sortable, isDragging }, ref) => {
    const form = useFormMetadata();

    const handleOpen = () => {
      form.update({ name: "text", value: card.text });
      form.update({ name: "url", value: card.url });
      form.update({ name: "id", value: card.id });
      cardModal.open();
    };

    const component = (
      <Card
        ref={ref}
        className={cn({
          "ring ring-primary animate-in zoom-in-100 scale-[103%]": isDragging,
        })}
        data-testid={`sortable-card`}
      >
        <div className="card-body flex-row items-center gap-4">
          <LinkIcon className="size-8" />
          <p className="flex-1 truncate">{card.text || card.url}</p>
          {sortable && (
            <div className="relative size-8">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <button
                  className="btn btn-square btn-primary"
                  data-testid={`sortable-card__edit`}
                  onClick={handleOpen}
                >
                  <PencilSquareIcon className="size-6" />
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
    if (card.url && !sortable) {
      return (
        <a href={card.url} target="_blank" rel="noreferrer">
          {component}
        </a>
      );
    }
    return component;
  },
);

SortableCard.displayName = "SortableCard";
