import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

import { useToast } from "~/atoms/toast/hooks";

export function SaveDelayedToast() {
  const { t } = useTranslation();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!searchParams.has("delayed")) return;
    toast.warning(t("board.save-delayed-warning-message"));
    setSearchParams(
      (prev) => {
        prev.delete("delayed");
        return prev;
      },
      {
        replace: true,
      },
    );
  }, [t, toast, searchParams, setSearchParams]);

  return null;
}
