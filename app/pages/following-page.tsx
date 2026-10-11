import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { UserIcon } from "@heroicons/react/24/solid";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { BlueskyIcon } from "~/components/icons/bluesky";
import { Main, RootLayout } from "~/components/layout";
import type { FollowingBoard } from "~/server/service/following/following";
import { formatRelativeTime } from "~/utils/relativeTime";

function Avatar({ avatar }: { avatar: string | null }) {
  if (!avatar) {
    return (
      <div className="avatar avatar-placeholder">
        <div className="w-10 rounded-full bg-neutral text-neutral-content">
          <UserIcon className="w-6" />
        </div>
      </div>
    );
  }
  return (
    <div className="avatar">
      <div className="w-10 rounded-full">
        <img src={avatar} alt="" />
      </div>
    </div>
  );
}

function BoardRow({ board, now }: { board: FollowingBoard; now: Date }) {
  const { i18n } = useTranslation();
  return (
    <li>
      <Link
        to={`/${board.owner.handleOrDid}`}
        className="flex items-center gap-3 rounded-box bg-base-100 p-3 shadow-sm hover:bg-base-300"
      >
        <Avatar avatar={board.owner.avatarUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">
            {board.owner.displayName || board.owner.handleOrDid}
          </p>
          <p className="truncate text-sm text-base-content/60">
            {board.owner.displayHandle} ·{" "}
            {formatRelativeTime(board.updatedAt, i18n.language, now)}
          </p>
        </div>
        <ChevronRightIcon className="size-5 text-base-content/40" />
      </Link>
    </li>
  );
}

function Message({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <p className="font-bold">{title}</p>
      <p className="text-base-content/60">{description}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

type Props = {
  boards: FollowingBoard[] | null;
  url: string;
  now: Date;
};

export function FollowingPage({ boards, url, now }: Props) {
  const { t } = useTranslation();

  return (
    <RootLayout>
      <Main className="py-4">
        <h1 className="mb-4 text-xl font-bold">{t("following.title")}</h1>
        {boards === null ? (
          <Message
            title={t("following.error-title")}
            description={t("following.error-description")}
          >
            <button className="btn" onClick={() => location.reload()}>
              {t("following.reload-button")}
            </button>
          </Message>
        ) : boards.length === 0 ? (
          <Message
            title={t("following.empty-title")}
            description={t("following.empty-description")}
          >
            <a
              className="btn-bluesky btn text-white"
              href={`https://bsky.app/intent/compose?text=${encodeURIComponent(t("following.share-text", { url }))}`}
              target="_blank"
              rel="noreferrer"
            >
              <BlueskyIcon className="size-5" />
              {t("following.share-button")}
            </a>
          </Message>
        ) : (
          <ul className="flex flex-col gap-2">
            {boards.map((board) => (
              <BoardRow key={board.owner.did} board={board} now={now} />
            ))}
          </ul>
        )}
      </Main>
    </RootLayout>
  );
}
