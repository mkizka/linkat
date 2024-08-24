import type { ValidBoard } from "~/models/board";

import { BoardCard } from "./board-card";

type Props = {
  board: ValidBoard;
};

export function BoardViewer({ board }: Props) {
  return (
    <div className="grid grid-cols-1 gap-2 py-4">
      {board.cards.map((card, index) => (
        <BoardCard key={index} card={card} />
      ))}
    </div>
  );
}
