import { UserIcon } from "@heroicons/react/24/solid";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Card } from "~/components/card";
import { Main, RootLayout } from "~/components/layout";
import { DeleteBoardButton } from "~/features/settings/delete-button";
import { LanguageSwitch } from "~/features/settings/language-switch";
import { LogoutButton } from "~/features/settings/logout-button";
import type { OwnerView } from "~/server/service/owner/ownerView";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <section className="card-body gap-4">
        <h2 className="card-title text-base">{title}</h2>
        {children}
      </section>
    </Card>
  );
}

type Props = {
  editor: OwnerView;
};

export function SettingsPage({ editor }: Props) {
  const { t } = useTranslation();
  return (
    <RootLayout>
      <Main className="flex flex-col gap-4 py-4">
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <Section title={t("settings.header-account")}>
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
                {t("settings.logged-in-as", { handle: editor.displayHandle })}
              </p>
            </div>
          </div>
          <LogoutButton />
        </Section>
        <Section title={t("settings.header-display")}>
          <div className="flex items-center justify-between gap-4">
            <span>{t("settings.language")}</span>
            <LanguageSwitch />
          </div>
        </Section>
        <Section title={t("settings.header-board")}>
          <DeleteBoardButton handle={editor.handleOrDid} />
          <p className="text-sm text-base-content/70">
            {t("settings.delete-board-warning")}
          </p>
        </Section>
      </Main>
    </RootLayout>
  );
}
