import { useFormMetadata } from "@conform-to/react";
import { PlusCircleIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

import { Card } from "~/components/card";

import { CardForm } from "./card-form";

const EDIT_CARD_MODAL_ID = "card-form-modal";

export const cardModal = {
  open: () => {
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    document.getElementById(EDIT_CARD_MODAL_ID).showModal();
  },
  close: () => {
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    document.getElementById(EDIT_CARD_MODAL_ID).close();
  },
};

export function CardFormModal() {
  const form = useFormMetadata();
  const { t } = useTranslation();

  const handleOpen = () => {
    form.reset();
    cardModal.open();
  };

  return (
    <>
      <Card
        className="bg-neutral text-neutral-content hover:bg-neutral/80"
        onClick={handleOpen}
        data-testid="card-form-modal__button"
      >
        <div className="card-body flex-row items-center justify-center">
          <PlusCircleIcon className="size-8" />
          {t("card-form-modal.add-card")}
        </div>
      </Card>
      <dialog id={EDIT_CARD_MODAL_ID} className="modal top-8 items-start">
        <div className="modal-box">
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
