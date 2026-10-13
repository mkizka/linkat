import { useTranslation } from "react-i18next";

import { SettingsSection } from "../settings-section";
import { DeleteBoardButton } from "./delete-button";

type Props = {
  handle: string;
};

export function BoardSection({ handle }: Props) {
  const { t } = useTranslation();
  return (
    <SettingsSection title={t("settings.header-board")}>
      <DeleteBoardButton handle={handle} />
      <p className="text-sm text-base-content/70">
        {t("settings.delete-board-warning")}
      </p>
    </SettingsSection>
  );
}
