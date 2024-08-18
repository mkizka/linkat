import { PencilSquareIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

import { useLinkatAgent } from "~/atoms/agent/hooks";
import { Button } from "~/components/button";
import type { ValidBoard } from "~/models/board";

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

  return (
    <div className="py-8">
      <Sortable cards={cards} setCards={setCards} />
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
