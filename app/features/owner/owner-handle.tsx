import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { useTranslation } from "react-i18next";

import type { OwnerView } from "~/server/service/owner/ownerView";

export function OwnerHandle({ owner }: { owner: OwnerView }) {
  const { t } = useTranslation();
  if (owner.displayHandle) {
    return owner.displayHandle;
  }
  return (
    <span className="inline-flex items-center gap-0.5 align-bottom italic">
      <ExclamationCircleIcon className="size-[1em]" />
      {t("owner.invalid-handle")}
    </span>
  );
}
