import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      data-testid="confirm-dialog"
    >
      <div className="modal-box">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="py-4">{description}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn flex-1"
            onClick={onCancel}
            data-testid="confirm-dialog__cancel"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn btn-error flex-1"
            onClick={onConfirm}
            data-testid="confirm-dialog__confirm"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
