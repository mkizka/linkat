import { useState } from "react";
import { useNavigation } from "react-router";

import { Main } from "~/components/layout";
import { BoardEditor } from "~/features/board/board-editor";
import { withId } from "~/features/board/card/with-id";
import { EditBar } from "~/features/edit/edit-bar";
import { LeaveConfirmDialog } from "~/features/edit/leave-confirm-dialog";
import type { ValidCard } from "~/models/card";
import type { OwnerView } from "~/server/service/owner/ownerView";

type Props = {
  editor: OwnerView;
  board: { cards: ValidCard[] } | null;
};

export function EditPage({ editor, board }: Props) {
  const navigation = useNavigation();
  const [cards, setCards] = useState(() => (board?.cards ?? []).map(withId));
  const [initialBoardJson] = useState(() => JSON.stringify({ cards }));
  const boardJson = JSON.stringify({ cards });
  const isSaving = navigation.formData !== undefined;

  return (
    <>
      <EditBar
        boardJson={boardJson}
        cardCount={cards.length}
        isSaving={isSaving}
      />
      <Main>
        <BoardEditor owner={editor} cards={cards} setCards={setCards} />
      </Main>
      <LeaveConfirmDialog
        isDirty={boardJson !== initialBoardJson}
        isSaving={isSaving}
      />
    </>
  );
}
