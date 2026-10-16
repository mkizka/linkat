import { useTranslation } from "react-i18next";
import { useFetcher } from "react-router";

import { Button } from "~/components/button";
import type { action as syncAction } from "~/routes/sync";

export function SyncButton() {
  const { t } = useTranslation();
  const sync = useFetcher<typeof syncAction>();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        loading={sync.state !== "idle"}
        onClick={() =>
          void sync.submit(null, { method: "post", action: "/sync" })
        }
        data-testid="sync-button"
      >
        {t("settings.sync-button")}
      </Button>
      {sync.state === "idle" && sync.data && (
        <p className="text-sm" role="status">
          {sync.data.ok
            ? t("settings.sync-done-message")
            : t("sync.error-message")}
        </p>
      )}
    </div>
  );
}
