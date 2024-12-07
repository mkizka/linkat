import { useTranslation } from "react-i18next";
import { redirect } from "react-router";

import { BackButton } from "~/components/back-button";
import { Card } from "~/components/card";
import { Footer, Main } from "~/components/layout";
import { DeleteBoardButton } from "~/features/settings/delete-button";
import { LogoutButton } from "~/features/settings/logout-button";
import { getSessionUserDid } from "~/server/oauth/session";

import type { Route } from "./+types/settings";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const userDid = await getSessionUserDid(request);
  if (!userDid) {
    throw redirect("/login");
  }
  return null;
};

export default function SettingsPage() {
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
            <DeleteBoardButton />
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
