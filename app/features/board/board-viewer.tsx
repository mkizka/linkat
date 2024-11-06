import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { Form, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/button";
import type { ValidBoard } from "~/models/board";
import type { ValidCard } from "~/models/card";
import { resolveHandleIfNeeded } from "~/utils/url";

import type { ProfileCardProps } from "./card/profile-card";
import { ProfileCard } from "./card/profile-card";
import { SortableCardList } from "./card/sortable-card-list";
import { CardFormModal, cardModal } from "./form/card-form-modal";
import type { CardFormPayload } from "./form/card-form-provider";
import { CardFormProvider } from "./form/card-form-provider";

type Props = {
  user: ProfileCardProps["user"];
  board: ValidBoard | null;
  url: string;
  editable?: boolean;
  isMine?: boolean;
};

const withId = (card: ValidCard) => ({
  ...card,
  id: crypto.randomUUID().toString(),
});

export function BoardViewer({ user, board, url, editable, isMine }: Props) {
  const [cards, setCards] = useState((board?.cards ?? []).map(withId));
  const { t } = useTranslation();
  const navigation = useNavigation();

  const handleSubmitCardForm = async (payload: CardFormPayload) => {
    const resolvedUrl =
      payload.url && (await resolveHandleIfNeeded(payload.url));
    if (payload.id) {
      setCards((cards) =>
        cards.map((card) => {
          if (card.id === payload.id) {
            return {
              id: payload.id,
              text: payload.text,
              emoji: payload.emoji,
              url: resolvedUrl,
            };
          }
          return card;
        }),
      );
    } else {
      setCards((cards) => {
        const newCard = withId({ ...payload, url: resolvedUrl });
        return [...cards, newCard];
      });
    }
    cardModal.close();
  };

  const handleDeleteCardForm = (id: string) => {
    const ok = confirm(t("board-viewer.confirm-delete-message"));
    if (!ok) return;
    setCards((cards) => cards.filter((card) => card.id !== id));
    cardModal.close();
  };

  return (
    <CardFormProvider
      onSubmit={handleSubmitCardForm}
      onDelete={handleDeleteCardForm}
    >
      <div className="flex flex-col gap-2 py-4">
        <ProfileCard
          user={user}
          url={url}
          showEditButton={!editable && isMine}
        />
        <SortableCardList
          cards={cards}
          setCards={setCards}
          sortable={editable}
        />
        {editable && <CardFormModal />}
        {editable && (
          <Form method="post">
            <input
              name="board"
              type="hidden"
              value={JSON.stringify({ cards })}
            />
            <Button
              className="btn-circle btn-primary btn-lg fixed bottom-4 right-4 w-32 shadow-xl"
              data-testid="board-viewer__submit"
              loading={navigation.state !== "idle"}
              data-umami-event="click-submit-button"
              data-umami-event-cards={cards.length}
            >
              <PencilSquareIcon className="size-8" />
              {t("board-viewer.submit-button")}
            </Button>
          </Form>
        )}
      </div>
    </CardFormProvider>
  );
}
