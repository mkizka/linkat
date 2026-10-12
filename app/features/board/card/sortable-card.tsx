import { useFormMetadata } from "@conform-to/react";
import { Bars2Icon, PencilSquareIcon } from "@heroicons/react/24/outline";

import { Card } from "~/components/card";
import { cardModal } from "~/features/board/form/card-form-modal";
import type { CardFormPayload } from "~/features/board/form/card-form-provider";
import { cn } from "~/utils/cn";

import { parseCard } from "./parser";
import { CardContent, TextCardContent } from "./view-card";
import type { CardWithId } from "./with-id";

type Props = {
  card: CardWithId;
  isDragging?: boolean;
};

export function SortableCard({ card, isDragging }: Props) {
  const parsed = parseCard(card);
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
      className="flex size-10 shrink-0 cursor-grab items-center justify-center text-base-content/60"
      data-movable-handle
    >
      <Bars2Icon className="size-6" />
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

  const dragging = cn({
    "animate-in zoom-in-100 scale-[103%]": isDragging,
  });

  if (parsed.type === "embed") {
    return (
      <div className={cn("relative", dragging)}>
        <div className="pointer-events-none opacity-40">
          <CardContent parsed={parsed} />
        </div>
        <div className="absolute inset-0 flex items-center justify-between px-2">
          {handle}
          {editButton}
        </div>
      </div>
    );
  }

  return (
    <Card className={dragging}>
      <div className="card-body flex-row items-center gap-2 px-2 py-4">
        {handle}
        {parsed.type === "feed" ? (
          <div className="pointer-events-none min-w-0 flex-1 [&_.card-body]:p-0">
            <CardContent parsed={parsed} />
          </div>
        ) : (
          <TextCardContent parsed={parsed} />
        )}
        {editButton}
      </div>
    </Card>
  );
}
