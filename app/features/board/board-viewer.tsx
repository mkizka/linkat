import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { useLinkatAgent } from "~/atoms/agent/hooks";
import { Button } from "~/components/button";
import type { ValidBoard } from "~/models/board";
import type { ValidCard } from "~/models/card";

import { AddCardModal } from "./add-card-modal";
import type { ProfileCardProps } from "./profile-card";
import { ProfileCard } from "./profile-card";
import { SortableCardList } from "./sortable-card-list";

type Props = {
  user: ProfileCardProps["user"];
  board: ValidBoard;
  editable?: boolean;
};

const withId = (card: ValidCard) => ({
  id: crypto.randomUUID().toString(),
  ...card,
});

export function BoardViewer({ user, board, editable }: Props) {
  const [cards, setCards] = useState(board.cards.map(withId));
  const agent = useLinkatAgent();

  const handleAddCard = (newCard: ValidCard) => {
    setCards((cards) => [...cards, withId(newCard)]);
  };

  const handleSaveBoard = async () => {
    if (!agent) {
      alert("予期しないエラーが発生しました。リロードします");
      location.reload();
      return;
    }
    await agent.updateBoard({ cards });
  };

  return (
    <div className="flex flex-col gap-2 py-4">
      <ProfileCard user={user} />
      <SortableCardList cards={cards} setCards={setCards} sortable={editable} />
      {editable && (
        <>
          <AddCardModal onSubmit={handleAddCard} />
          <Button
            className="btn-circle btn-lg fixed bottom-4 right-4 w-32 shadow"
            onClick={handleSaveBoard}
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
