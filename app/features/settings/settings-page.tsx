import { useTranslation } from "react-i18next";

import { BackButton } from "~/components/back-button";
import { Card } from "~/components/card";
import { Footer, Main } from "~/components/layout";
import type { OwnerView } from "~/models/owner";

import { DeleteBoardButton } from "./delete-button";
import { LogoutButton } from "./logout-button";

type Props = {
  editor: OwnerView;
};

export function SettingsPage({ editor }: Props) {
  const { t } = useTranslation();
  return (
    <>
      <Main className="py-4">
        <Card>
          <div className="card-body gap-4">
            <BackButton />
            <h1 className="card-title justify-center">{t("settings.title")}</h1>
            <h2 className="border-b-2 border-gray-200 pb-1 font-bold">
              {t("settings.header-account")}
            </h2>
            <LogoutButton />
            <h2 className="border-b-2 border-gray-200 pb-1 font-bold">
              {t("settings.header-board")}
            </h2>
            <DeleteBoardButton handle={editor.handleOrDid} />
            <p className="text-gray-400">
              {t("settings.delete-board-warning")}
            </p>
          </div>
        </Card>
      </Main>
      <Footer />
    </>
  );
}
