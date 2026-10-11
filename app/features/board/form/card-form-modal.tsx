import { useFormMetadata } from "@conform-to/react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

import { CardForm } from "./card-form";
import type { CardFormPayload } from "./card-form-provider";

const EDIT_CARD_MODAL_ID = "card-form-modal";

export const cardModal = {
  open: () => {
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    document.getElementById(EDIT_CARD_MODAL_ID).showModal();
    // なぜかすぐ呼ぶと動かない
    setTimeout(() => {
      // @ts-expect-error
      document.getElementById("card-form-url").focus();
    }, 100);
  },
  close: () => {
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    document.getElementById(EDIT_CARD_MODAL_ID).close();
  },
};

export function CardFormModal() {
  const form = useFormMetadata<CardFormPayload>();
  const { t } = useTranslation();

  const handleOpen = () => {
    form.reset();
    cardModal.open();
  };

  return (
    <>
      <button
        type="button"
        className="btn h-auto border-2 border-dashed border-base-content/30 bg-transparent py-4"
        onClick={handleOpen}
        data-testid="card-form-modal__button"
      >
        <PlusIcon className="size-6" />
        {t("card-form-modal.add-card")}
      </button>
      <dialog id={EDIT_CARD_MODAL_ID} className="modal items-start">
        <div className="modal-box mt-8">
          <CardForm />
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
