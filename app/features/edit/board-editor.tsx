import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { useLinkatAgent } from "~/atoms/agent/hooks";
import { Button } from "~/components/button";
import type { ValidBoard } from "~/models/board";
import type { ValidCard } from "~/models/card";

import { AddCardModal } from "./add-card-modal";
import { Sortable } from "./sortable";

type Props = {
  initialBoard: ValidBoard;
};

export function BoardEditor({ initialBoard }: Props) {
  const [cards, setCards] = useState(
    initialBoard.cards.map((card) => ({
      ...card,
      id: crypto.randomUUID().toString(),
    })),
  );
  const agent = useLinkatAgent();

  const handleSubmit = (newCard: ValidCard) => {
    setCards((cards) => [
      ...cards,
      { ...newCard, id: crypto.randomUUID().toString() },
    ]);
  };

  return (
    <div className="py-4">
      <Sortable cards={cards} setCards={setCards} />
      <AddCardModal onSubmit={handleSubmit} />
      <Button
        className="btn-circle btn-lg fixed bottom-4 right-4 w-32 shadow"
        onClick={() => agent.updateBoard({ cards })}
      >
        <PencilSquareIcon className="size-8" />
        保存
      </Button>
    </div>
  );
}
