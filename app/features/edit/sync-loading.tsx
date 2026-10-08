import { useTranslation } from "react-i18next";

export function SyncLoading() {
  const { t } = useTranslation();
  return (
    <div
      className="flex flex-col items-center gap-4 py-16 text-center"
      role="status"
    >
      <div className="loading loading-spinner w-12" />
      <p>{t("edit.sync-loading-message")}</p>
    </div>
  );
}
