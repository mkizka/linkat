import {
  ArrowPathIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/button";

export function SyncError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div
      className="flex flex-col items-center gap-4 py-16 text-center"
      role="alert"
    >
      <ExclamationCircleIcon className="size-12 text-error" />
      <div>
        <p>{t("edit.sync-error-message")}</p>
        <p className="text-sm opacity-70">{t("edit.sync-error-description")}</p>
      </div>
      <Button className="btn-primary" onClick={onRetry}>
        <ArrowPathIcon className="size-5" />
        {t("edit.sync-retry-button")}
      </Button>
    </div>
  );
}
