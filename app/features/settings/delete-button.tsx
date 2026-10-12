import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSubmit } from "react-router";

import { Button } from "~/components/button";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { useUmami } from "~/hooks/useUmami";

type Props = {
  handle: string;
};

export function DeleteBoardButton({ handle }: Props) {
  const { t } = useTranslation();
  const submit = useSubmit();
  const umami = useUmami();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        className="btn-error"
        onClick={() => setOpen(true)}
        data-umami-event="click-delete-board-button"
        data-testid="delete-board-button"
      >
        {t("delete-board-button.text")}
      </Button>
      <ConfirmDialog
        open={open}
        title={t("delete-board-button.confirm-message")}
        description={t("delete-board-button.confirm-description")}
        cancelLabel={t("delete-board-button.cancel")}
        confirmLabel={t("delete-board-button.confirm")}
        onCancel={() => {
          setOpen(false);
          umami.track("handle-delete-board", { action: "cancel", handle });
        }}
        onConfirm={() => {
          setOpen(false);
          umami.track("handle-delete-board", { action: "confirm", handle });
          void submit(null, { action: "/delete", method: "post" });
        }}
      />
    </>
  );
}
