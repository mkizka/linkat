import { useState } from "react";
import { useNavigation } from "react-router";

import { Main } from "~/components/layout";
import { BoardEditor, withId } from "~/features/board/board-editor";
import { EditBar } from "~/features/edit/edit-bar";
import { LeaveConfirmDialog } from "~/features/edit/leave-confirm-dialog";
import { SyncError } from "~/features/edit/sync-error";
import { SyncLoading } from "~/features/edit/sync-loading";
import type { ValidCard } from "~/models/card";
import type { OwnerView } from "~/server/service/owner/ownerView";

type EditorProps = {
  editor: OwnerView;
  board: { cards: ValidCard[] } | null;
  url: string;
};

function Editor({ editor, board, url }: EditorProps) {
  const navigation = useNavigation();
  const [cards, setCards] = useState(() => (board?.cards ?? []).map(withId));
  const [initialBoardJson] = useState(() => JSON.stringify({ cards }));
  const boardJson = JSON.stringify({ cards });
  const isSaving = navigation.state !== "idle";

  return (
    <>
      <EditBar
        cancelTo={board ? `/${editor.handleOrDid}` : "/"}
        boardJson={boardJson}
        cardCount={cards.length}
        isSaving={isSaving}
      />
      <Main>
        <BoardEditor
          owner={editor}
          url={url}
          cards={cards}
          setCards={setCards}
        />
      </Main>
      <LeaveConfirmDialog
        isDirty={boardJson !== initialBoardJson}
        isSaving={isSaving}
      />
    </>
  );
}

type Props = EditorProps & {
  syncState: "ready" | "loading" | "error";
  onRetrySync: () => void;
};

export function EditPage({ syncState, onRetrySync, ...editorProps }: Props) {
  if (syncState === "ready") {
    return <Editor {...editorProps} />;
  }
  return (
    <Main className="utils--center">
      {syncState === "loading" ? (
        <SyncLoading />
      ) : (
        <SyncError onRetry={onRetrySync} />
      )}
    </Main>
  );
}
