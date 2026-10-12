import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ConfirmDialog } from "~/components/confirm-dialog";
import type { ValidCard } from "~/models/card";
import type { OwnerView } from "~/server/service/owner/ownerView";
import { resolveHandleIfNeeded } from "~/utils/url";

import { ProfileCard } from "./card/profile-card";
import { SortableCardList } from "./card/sortable-card-list";
import { CardFormModal, cardModal } from "./form/card-form-modal";
import type { CardFormPayload } from "./form/card-form-provider";
import { CardFormProvider } from "./form/card-form-provider";

type EditingCard = ValidCard & { id: string };

export const withId = (card: ValidCard): EditingCard => ({
  ...card,
  id: crypto.randomUUID(),
});

type Props = {
  owner: OwnerView;
  url: string;
  cards: EditingCard[];
  setCards: Dispatch<SetStateAction<EditingCard[]>>;
};

export function BoardEditor({ owner, url, cards, setCards }: Props) {
  const { t } = useTranslation();
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

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
    cardModal.close();
  };

  const handleDeleteCard = () => {
    setCards((cards) => cards.filter((card) => card.id !== deletingCardId));
    setDeletingCardId(null);
    cardModal.close();
  };

  return (
    <CardFormProvider
      onSubmit={handleSubmitCardForm}
      onDelete={setDeletingCardId}
    >
      <div className="flex flex-col gap-2 py-4">
        <ProfileCard owner={owner} url={url} />
        <SortableCardList cards={cards} onChange={setCards} />
        <CardFormModal />
      </div>
      <ConfirmDialog
        open={deletingCardId !== null}
        title={t("edit.confirm-delete-title")}
        description={t("edit.confirm-delete-description")}
        cancelLabel={t("edit.confirm-delete-cancel")}
        confirmLabel={t("edit.confirm-delete-confirm")}
        onCancel={() => setDeletingCardId(null)}
        onConfirm={handleDeleteCard}
      />
    </CardFormProvider>
  );
}
