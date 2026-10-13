import { useTranslation } from "react-i18next";

import { Main, RootLayout } from "~/components/layout";
import { AccountSection } from "~/features/settings/account-section";
import { BoardSection } from "~/features/settings/board-section";
import { DisplaySection } from "~/features/settings/display-section";
import type { OwnerView } from "~/server/service/owner/ownerView";

type Props = {
  editor: OwnerView;
};

export function SettingsPage({ editor }: Props) {
  const { t } = useTranslation();
  return (
    <RootLayout>
      <Main className="flex flex-col gap-4 py-4">
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <AccountSection editor={editor} />
        <DisplaySection />
        <BoardSection handle={editor.handleOrDid} />
      </Main>
    </RootLayout>
  );
}
