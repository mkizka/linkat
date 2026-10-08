import {
  ArrowPathIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/button";
import { Main } from "~/components/layout";

export function SyncLoading() {
  const { t } = useTranslation();
  return (
    <Main>
      <div
        className="flex flex-col items-center gap-4 py-16 text-center"
        role="status"
      >
        <div className="loading loading-spinner w-12" />
        <p>{t("edit.sync-loading-message")}</p>
      </div>
    </Main>
  );
}

export function SyncError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <Main>
      <div
        className="flex flex-col items-center gap-4 py-16 text-center"
        role="alert"
      >
        <ExclamationCircleIcon className="size-12 text-error" />
        <div>
          <p>{t("edit.sync-error-message")}</p>
          <p className="text-sm opacity-70">
            {t("edit.sync-error-description")}
          </p>
        </div>
        <Button className="btn-primary" onClick={onRetry}>
          <ArrowPathIcon className="size-5" />
          {t("edit.sync-retry-button")}
        </Button>
      </div>
    </Main>
  );
}
