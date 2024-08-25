import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { useLinkatAgent } from "~/atoms/agent/hooks";
import { Button } from "~/components/button";
import type { ValidBoard } from "~/models/board";
import type { ValidCard } from "~/models/card";

import { AddCardModal } from "./add-card-modal";
import { SortableCardList } from "./sortable-card-list";

type Props = {
  board: ValidBoard;
  editable?: boolean;
};

const withId = (card: ValidCard) => ({
  id: crypto.randomUUID().toString(),
  ...card,
});

export function BoardViewer({ board, editable }: Props) {
  const [cards, setCards] = useState(board.cards.map(withId));
  const agent = useLinkatAgent();

  const handleSubmit = (newCard: ValidCard) => {
    setCards((cards) => [...cards, withId(newCard)]);
  };

  return (
    <div className="py-4">
      <SortableCardList cards={cards} setCards={setCards} sortable={editable} />
      {editable && (
        <>
          <AddCardModal onSubmit={handleSubmit} />
          <Button
            className="btn-circle btn-lg fixed bottom-4 right-4 w-32 shadow"
            onClick={() => agent.updateBoard({ cards })}
            data-testid="board-viewer__submit"
          >
            <PencilSquareIcon className="size-8" />
            保存
          </Button>
        </>
      )}
    </div>
  );
}
