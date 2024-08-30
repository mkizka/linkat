import { useFormMetadata } from "@conform-to/react";
import { ArrowsUpDownIcon, LinkIcon } from "@heroicons/react/24/outline";
import { forwardRef } from "react";

import { Card } from "~/components/card";
import type { ValidCard } from "~/models/card";
import { cn } from "~/utils/cn";

import { openModal } from "./add-card-modal";

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
      openModal();
    };

    const component = (
      <Card
        ref={ref}
        className={cn({
          "ring ring-primary animate-in zoom-in-100 scale-[103%]": isDragging,
        })}
        data-testid={`sortable-card`}
        onClick={handleOpen}
      >
        <div className="card-body flex-row items-center gap-4">
          <LinkIcon className="size-8" />
          <p className="flex-1 truncate">{card.text || card.url}</p>
          <button
            className="btn btn-square btn-outline"
            tabIndex={-1}
            data-movable-handle
          >
            <ArrowsUpDownIcon className="size-6" />
          </button>
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
