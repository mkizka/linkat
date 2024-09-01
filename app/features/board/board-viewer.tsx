import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { useLinkatAgent } from "~/atoms/agent/hooks";
import { useToast } from "~/atoms/toast/hooks";
import { useUser } from "~/atoms/user/hooks";
import { Button } from "~/components/button";
import type { ValidBoard } from "~/models/board";
import type { ValidCard } from "~/models/card";

import type { ProfileCardProps } from "./card/profile-card";
import { ProfileCard } from "./card/profile-card";
import { SortableCardList } from "./card/sortable-card-list";
import { CardFormModal } from "./form/card-form-modal";
import type { CardFormPayload } from "./form/card-form-provider";
import { CardFormProvider } from "./form/card-form-provider";

type Props = {
  user: ProfileCardProps["user"];
  board: ValidBoard | null;
  editable?: boolean;
};

const withId = (card: ValidCard) => ({
  ...card,
  id: crypto.randomUUID().toString(),
});

export function BoardViewer({ user, board, editable }: Props) {
  const [cards, setCards] = useState((board?.cards ?? []).map(withId));
  const agent = useLinkatAgent();
  const toast = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const isLoginUser = useUser()?.profile.did === user.did;

  const handleSubmitCardForm = (payload: CardFormPayload) => {
    if (payload.id) {
      setCards((cards) =>
        cards.map((card) => {
          if (card.id === payload.id) {
            return {
              id: payload.id,
              text: payload.text,
              url: payload.url,
            };
          }
          return card;
        }),
      );
    } else {
      setCards((cards) => [...cards, withId(payload)]);
    }
  };

  const handleDeleteCardForm = (id: string) => {
    setCards((cards) => cards.filter((card) => card.id !== id));
  };

  const handleSaveBoard = async () => {
    if (!agent) {
      alert("予期しないエラーが発生しました");
      return;
    }
    await agent.updateBoard({ cards });
    toast.success("保存しました");
    setIsSaved(true);
  };

  const profileCardButton = (() => {
    // 編集画面かつ、1回以上保存されている場合
    if (editable) {
      return isSaved || board !== null ? "preview" : "none";
    }
    // 編集画面以外かつログインユーザーなら編集ボタンを表示
    if (isLoginUser) {
      return "edit";
    }
    return "link";
  })();

  return (
    <CardFormProvider
      onSubmit={handleSubmitCardForm}
      onDelete={handleDeleteCardForm}
    >
      <div className="flex flex-col gap-2 py-4">
        <ProfileCard user={user} button={profileCardButton} />
        <SortableCardList
          cards={cards}
          setCards={setCards}
          sortable={editable}
        />
        {editable && <CardFormModal />}
        {editable && (
          <Button
            className="btn-circle btn-lg fixed bottom-4 right-4 w-32 shadow"
            onClick={handleSaveBoard}
            data-testid="board-viewer__submit"
          >
            <PencilSquareIcon className="size-8" />
            保存
          </Button>
        )}
      </div>
    </CardFormProvider>
  );
}
