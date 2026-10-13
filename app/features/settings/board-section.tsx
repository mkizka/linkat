import { useTranslation } from "react-i18next";

import { DeleteBoardButton } from "./delete-button";
import { SettingsSection } from "./settings-section";

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
