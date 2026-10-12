import { useFormMetadata } from "@conform-to/react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

import type { CardWithId } from "~/features/board/card/with-id";

import { CardForm } from "./card-form";
import type { CardFormPayload } from "./card-form-provider";

const EDIT_CARD_MODAL_ID = "card-form-modal";

const getDialog = () =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  document.getElementById(EDIT_CARD_MODAL_ID) as HTMLDialogElement;

export const closeCardModal = () => getDialog().close();

export function useCardModal() {
  const form = useFormMetadata<CardFormPayload>();

  const open = () => {
    getDialog().showModal();
    // なぜかすぐ呼ぶと動かない
    setTimeout(() => document.getElementById("card-form-url")?.focus(), 100);
  };

  return {
    openNew: () => {
      form.reset();
      open();
    },
    openEdit: (card: CardWithId) => {
      form.update({ value: card });
      open();
    },
  };
}

type Props = {
  onDelete: (id: string) => void;
};

export function CardFormModal({ onDelete }: Props) {
  const { openNew } = useCardModal();
  const { t } = useTranslation();

  return (
    <>
      <button
        type="button"
        className="btn h-auto border-2 border-dashed border-base-content/30 bg-transparent py-4"
        onClick={openNew}
        data-testid="card-form-modal__button"
      >
        <PlusIcon className="size-6" />
        {t("card-form-modal.add-card")}
      </button>
      <dialog id={EDIT_CARD_MODAL_ID} className="modal items-start">
        <div className="modal-box mt-8">
          <CardForm onDelete={onDelete} />
          <form method="dialog">
            <button className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2">
              ✕
            </button>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
