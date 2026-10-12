import {
  ArrowRightIcon,
  AtSymbolIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Main, RootLayout } from "~/components/layout";
import { Reasons } from "~/features/top/reasons";
import { RecentBoards } from "~/features/top/recent-boards";
import { SampleBoardPreview } from "~/features/top/sample-board-preview";
import type { OwnerView } from "~/server/service/owner/ownerView";
import { cn } from "~/utils/cn";

type Props = {
  isLogin: boolean;
  recentOwners: OwnerView[];
  sampleUrl: string;
};

export function TopPage({ isLogin, recentOwners, sampleUrl }: Props) {
  const { t, i18n } = useTranslation();
  const hero = (
    <h2
      className={cn(
        "whitespace-pre-line text-center font-bold",
        i18n.language === "ja" ? "text-4xl" : "text-3xl",
      )}
    >
      {t("_index.hero-text")}
    </h2>
  );
  if (!isLogin) {
    return (
      <RootLayout>
        <Main className="flex flex-col gap-8 py-8">
          {hero}
          <div className="flex flex-col items-center gap-4">
            <Link
              to="/login"
              className="btn-bluesky btn w-64 rounded-full text-blue-100"
              data-testid="index__login-link"
            >
              <AtSymbolIcon className="size-6" />
              {t("_index.login-link")}
            </Link>
            <Link
              to="/about"
              className="text-sm text-base-content/70 underline"
            >
              {t("_index.notes-link")}
            </Link>
          </div>
          <RecentBoards owners={recentOwners} />
          <SampleBoardPreview url={sampleUrl} />
          <Reasons />
        </Main>
      </RootLayout>
    );
  }
  return (
    <RootLayout>
      <Main className="utils--center">
        <div className="text-center">
          {hero}
          <div className="mt-12 flex flex-col items-center gap-2">
            <Link
              to="/edit"
              className="btn btn-primary w-64"
              data-testid="index__edit-link"
            >
              <PencilSquareIcon className="size-6" />
              {t("_index.edit-link")}
            </Link>
            <Link to="/sample" className="btn btn-neutral w-64">
              <ArrowRightIcon className="size-6" />
              {t("_index.sample-link")}
            </Link>
            <div className={cn("flex flex-col gap-2 mt-8")}>
              <p>
                <Link to="/about" className="underline">
                  {t("_index.notes-link")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Main>
    </RootLayout>
  );
}
