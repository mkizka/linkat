import { PlusCircleIcon } from "@heroicons/react/24/solid";

import { Card } from "~/components/card";

import type { AddCardProps } from "./add-card-form";
import { AddCardForm } from "./add-card-form";

type Props = {
  onSubmit: AddCardProps["onSubmit"];
};

export function AddCardModal({ onSubmit }: Props) {
  const handleSubmit: AddCardProps["onSubmit"] = (...args) => {
    onSubmit(...args);
    // https://daisyui.com/components/modal/
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    document.getElementById("add-card-modal").close();
  };
  return (
    <>
      <Card
        className="mt-2 bg-neutral text-neutral-content hover:bg-neutral/80"
        onClick={() => {
          // https://daisyui.com/components/modal/
          // @ts-expect-error
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          document.getElementById("add-card-modal").showModal();
        }}
      >
        <div className="card-body flex-row items-center justify-center">
          <PlusCircleIcon className="size-8" />
          カードを追加
        </div>
      </Card>
      <dialog id="add-card-modal" className="modal">
        <div className="modal-box">
          <AddCardForm onSubmit={handleSubmit} />
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
