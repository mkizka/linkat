import type { Dispatch, SetStateAction } from "react";

import type { OwnerView } from "~/server/service/owner/ownerView";
import { resolveHandleIfNeeded } from "~/utils/url";

import { ProfileCard } from "./card/profile-card";
import { SortableCardList } from "./card/sortable-card-list";
import type { CardWithId } from "./card/with-id";
import { withId } from "./card/with-id";
import { CardFormModal, closeCardModal } from "./form/card-form-modal";
import type { CardFormPayload } from "./form/card-form-provider";
import { CardFormProvider } from "./form/card-form-provider";

type Props = {
  owner: OwnerView;
  url: string;
  cards: CardWithId[];
  setCards: Dispatch<SetStateAction<CardWithId[]>>;
};

export function BoardEditor({ owner, url, cards, setCards }: Props) {
  const handleSubmitCardForm = async (payload: CardFormPayload) => {
    const resolvedUrl =
      payload.url && (await resolveHandleIfNeeded(payload.url));
    if (payload.id) {
      setCards((cards) =>
        cards.map((card) =>
          card.id === payload.id
            ? {
                id: payload.id,
                text: payload.text,
                emoji: payload.emoji,
                url: resolvedUrl,
              }
            : card,
        ),
      );
    } else {
      setCards((cards) => [...cards, withId({ ...payload, url: resolvedUrl })]);
    }
    closeCardModal();
  };

  const handleDeleteCard = (id: string) => {
    setCards((cards) => cards.filter((card) => card.id !== id));
    closeCardModal();
  };

  return (
    <CardFormProvider onSubmit={handleSubmitCardForm}>
      <div className="flex flex-col gap-2 py-4">
        <ProfileCard owner={owner} url={url} />
        <SortableCardList cards={cards} onChange={setCards} />
        <CardFormModal onDelete={handleDeleteCard} />
      </div>
    </CardFormProvider>
  );
}
