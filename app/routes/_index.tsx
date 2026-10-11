import {
  ArrowRightIcon,
  AtSymbolIcon,
  ChatBubbleBottomCenterTextIcon,
  LockClosedIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Card } from "~/components/card";
import { Main, RootLayout } from "~/components/layout";
import { parseCard } from "~/features/board/card/parser";
import { CardContent } from "~/features/board/card/sortable-card";
import { useSampleBoard } from "~/features/board/sample-board";
import { RecentBoards, UserAvatar } from "~/features/top/recent-boards";
import { getInstance } from "~/i18n/i18n";
import { di } from "~/server/di";
import { cn } from "~/utils/cn";
import { env } from "~/utils/env";
import { createMeta } from "~/utils/meta";

import type { Route } from "./+types/_index";

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const userDid = await di.sessionService.getSessionUserDid(request);
  const i18next = getInstance(context);
  const recentUsers = await di.boardRepository.findRecentlyUpdatedUsers(8);
  return {
    isLogin: !!userDid,
    recentUsers: recentUsers.map(({ avatar, displayName, handle }) => ({
      avatar,
      displayName,
      handle,
    })),
    title: i18next.t("_index.meta-title"),
    description: i18next.t("_index.meta-description"),
    url: env.PUBLIC_URL,
  };
};

export const meta = ({ loaderData }: Route.MetaArgs) => {
  const { title, description, url } = loaderData;
  return createMeta({ title, description, url });
};

function SampleBoardPreview() {
  const { user, cards } = useSampleBoard();
  const parsedCards = cards.map(parseCard);
  const previewCards = (["link", "text", "embed"] as const).flatMap((type) =>
    parsedCards.filter((card) => card.type === type).slice(0, 1),
  );
  return (
    <Link
      to="/sample"
      className="block -rotate-2 px-4"
      data-umami-event="click-sample-preview"
    >
      <div className="pointer-events-none flex flex-col gap-2 rounded-box bg-base-100 p-3 shadow-xl">
        <div className="flex items-center gap-2">
          <UserAvatar user={user} />
          <div>
            <p className="font-bold">{user.displayName}</p>
            <p className="text-sm text-base-content/70">@{user.handle}</p>
          </div>
        </div>
        {previewCards.map((parsed) => (
          <Card key={parsed.type} className="bg-base-200 shadow-none">
            <CardContent parsed={parsed} />
          </Card>
        ))}
      </div>
    </Link>
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

export default function Index({ loaderData }: Route.ComponentProps) {
  const { isLogin, recentUsers } = loaderData;
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
          <RecentBoards users={recentUsers} />
          <SampleBoardPreview />
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
