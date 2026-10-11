import {
  ArrowRightIcon,
  AtSymbolIcon,
  ChatBubbleBottomCenterTextIcon,
  LockClosedIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Main, RootLayout } from "~/components/layout";
import { BoardViewer } from "~/features/board/board-viewer";
import { useSampleBoard } from "~/features/board/sample-board";
import { RecentBoards } from "~/features/top/recent-boards";
import type { OwnerView } from "~/server/service/owner/ownerView";
import { cn } from "~/utils/cn";

function SampleBoardPreview({ url }: { url: string }) {
  const { t } = useTranslation();
  const { owner, cards } = useSampleBoard();
  return (
    <div className="relative">
      <BoardViewer url={url} owner={owner} board={{ cards }} />
      <Link
        to="/sample"
        className="absolute inset-0"
        aria-label={t("_index.sample-link")}
        data-umami-event="click-sample-preview"
      />
    </div>
  );
}

function Reasons() {
  const { t } = useTranslation();
  const reasons = [
    { icon: AtSymbolIcon, text: t("_index.reason-bluesky-account") },
    { icon: ChatBubbleBottomCenterTextIcon, text: t("_index.reason-embed") },
    { icon: LockClosedIcon, text: t("_index.reason-your-data") },
  ];
  return (
    <ul className="grid grid-cols-3 gap-2 rounded-box bg-base-100 px-2 py-4 text-center text-xs font-bold">
      {reasons.map(({ icon: Icon, text }) => (
        <li key={text} className="flex flex-col items-center gap-2">
          <Icon className="size-6 text-blue-500" />
          <span className="whitespace-pre-line">{text}</span>
        </li>
      ))}
    </ul>
  );
}

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
          <div className="flex flex-col items-center gap-2">
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
