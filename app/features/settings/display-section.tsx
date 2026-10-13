import { useTranslation } from "react-i18next";

import { LanguageSwitch } from "./language-switch";
import { SettingsSection } from "./settings-section";

export function DisplaySection() {
  const { t } = useTranslation();
  return (
    <SettingsSection title={t("settings.header-display")}>
      <div className="flex items-center justify-between gap-4">
        <span>{t("settings.language")}</span>
        <LanguageSwitch />
      </div>
    </SettingsSection>
  );
}
