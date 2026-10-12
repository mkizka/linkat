import { useTranslation } from "react-i18next";
import { useBeforeUnload, useBlocker } from "react-router";

import { ConfirmDialog } from "~/components/confirm-dialog";
import { useUmami } from "~/hooks/useUmami";

type Props = {
  isDirty: boolean;
  isSaving: boolean;
};

export function LeaveConfirmDialog({ isDirty, isSaving }: Props) {
  const { t } = useTranslation();
  const umami = useUmami();

  useBeforeUnload((event) => {
    if (!isDirty) return;
    umami.track("unload-edit");
    event.preventDefault();
  });

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      !isSaving &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  return (
    <ConfirmDialog
      open={blocker.state === "blocked"}
      title={t("edit.confirm-leave-title")}
      description={t("edit.confirm-leave-description")}
      cancelLabel={t("edit.confirm-leave-cancel")}
      confirmLabel={t("edit.confirm-leave-confirm")}
      onCancel={() => {
        umami.track("leave-edit", { action: "cancel" });
        blocker.reset?.();
      }}
      onConfirm={() => {
        umami.track("leave-edit", { action: "confirm" });
        blocker.proceed?.();
      }}
    />
  );
}
