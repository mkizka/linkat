import { UserIcon } from "@heroicons/react/24/solid";
import { Trans, useTranslation } from "react-i18next";

import { OwnerHandle } from "~/features/owner/owner-handle";
import type { OwnerView } from "~/server/service/owner/ownerView";

import { SettingsSection } from "../settings-section";
import { LogoutButton } from "./logout-button";

type Props = {
  editor: OwnerView;
};

export function AccountSection({ editor }: Props) {
  const { t } = useTranslation();
  return (
    <SettingsSection title={t("settings.header-account")}>
      <div className="flex items-center gap-3">
        <div className="avatar avatar-placeholder">
          <div className="w-12 rounded-full bg-neutral text-neutral-content">
            {editor.avatarUrl ? (
              <img src={editor.avatarUrl} alt="" />
            ) : (
              <UserIcon className="w-8" />
            )}
          </div>
        </div>
        <div className="min-w-0">
          {editor.displayName && (
            <p className="truncate font-bold">{editor.displayName}</p>
          )}
          <p className="truncate text-sm text-base-content/70">
            <Trans
              i18nKey="settings.logged-in-as"
              components={{ handle: <OwnerHandle owner={editor} /> }}
            />
          </p>
        </div>
      </div>
      <LogoutButton />
    </SettingsSection>
  );
}
