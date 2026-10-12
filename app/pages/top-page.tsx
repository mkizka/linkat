import {
  AtSymbolIcon,
  Cog6ToothIcon,
  EyeIcon,
  PencilSquareIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { UserIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Main, RootLayout } from "~/components/layout";
import { Reasons } from "~/features/top/reasons";
import { RecentBoards } from "~/features/top/recent-boards";
import { SampleBoardPreview } from "~/features/top/sample-board-preview";
import type { OwnerView } from "~/server/service/owner/ownerView";
import { cn } from "~/utils/cn";

type Props = {
  editor: OwnerView | null;
  hasBoard: boolean;
  recentOwners: OwnerView[];
  sampleUrl: string;
};

export function TopPage({ editor, hasBoard, recentOwners, sampleUrl }: Props) {
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
  if (!editor) {
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
  const tiles = [
    ...(hasBoard
      ? [
          {
            to: `/${editor.handleOrDid}`,
            icon: EyeIcon,
            label: t("_index.view-board-link"),
          },
          {
            to: "/edit",
            icon: PencilSquareIcon,
            label: t("_index.edit-link"),
            testId: "index__edit-link",
          },
        ]
      : [
          {
            to: "/edit",
            icon: PlusIcon,
            label: t("_index.create-board-link"),
            testId: "index__edit-link",
          },
        ]),
    { to: "/settings", icon: Cog6ToothIcon, label: t("_index.settings-link") },
  ];
  return (
    <RootLayout>
      <Main className="flex flex-col gap-8 py-8">
        <div className="flex flex-col items-center text-center">
          <div className="avatar avatar-placeholder mb-2">
            <div className="w-24 rounded-full bg-neutral text-neutral-content">
              {editor.avatarUrl ? (
                <img src={editor.avatarUrl} alt="" />
              ) : (
                <UserIcon className="w-14" />
              )}
            </div>
          </div>
          <h2 className="text-xl font-bold">{editor.displayName}</h2>
          <p className="text-base-content/70">{editor.displayHandle}</p>
        </div>
        <div className="flex justify-center gap-2">
          {tiles.map(({ to, icon: Icon, label, testId }) => (
            <Link
              key={to}
              to={to}
              className="card w-[calc((100%-1rem)/3)] items-center gap-1 bg-base-100 py-3 text-sm font-bold shadow-sm"
              data-testid={testId}
            >
              <Icon className="size-6" />
              {label}
            </Link>
          ))}
        </div>
        <div className="px-8">
          <RecentBoards owners={recentOwners} />
        </div>
      </Main>
    </RootLayout>
  );
}
