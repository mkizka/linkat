import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSubmit } from "react-router";

import { Button } from "~/components/button";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { useUmami } from "~/hooks/useUmami";

export function LogoutButton() {
  const { t } = useTranslation();
  const submit = useSubmit();
  const umami = useUmami();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        data-umami-event="click-logout-button"
        data-testid="logout-button"
      >
        {t("logout-button.text")}
      </Button>
      <ConfirmDialog
        open={open}
        title={t("logout-button.confirm-message")}
        cancelLabel={t("logout-button.cancel")}
        confirmLabel={t("logout-button.text")}
        confirmClassName="btn-neutral"
        onCancel={() => {
          setOpen(false);
          umami.track("handle-logout", { action: "cancel" });
        }}
        onConfirm={() => {
          setOpen(false);
          umami.track("handle-logout", { action: "confirm" });
          void submit(null, { action: "/logout", method: "post" });
        }}
      />
    </>
  );
}
