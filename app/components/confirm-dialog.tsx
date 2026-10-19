import { useEffect, useRef } from "react";

import { cn } from "~/utils/cn";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  cancelLabel: string;
  confirmLabel: string;
  confirmClassName?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  cancelLabel,
  confirmLabel,
  confirmClassName = "btn-error",
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
        {description && <p className="pt-4">{description}</p>}
        <div className="mt-4 flex gap-2">
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
            className={cn("btn flex-1", confirmClassName)}
            onClick={onConfirm}
            data-testid="confirm-dialog__confirm"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
      <button type="button" className="modal-backdrop" onClick={onCancel}>
        close
      </button>
    </dialog>
  );
}
