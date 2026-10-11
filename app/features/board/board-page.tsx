import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";

import { BlueskyIcon } from "~/components/icons/bluesky";
import { Main } from "~/components/layout";
import type { ValidCard } from "~/models/card";

import { BoardFooter } from "./board-footer";
import { BoardMenu } from "./board-menu";
import { BoardViewer } from "./board-viewer";
import type { ProfileCardProps } from "./card/profile-card";
import { ShareModal } from "./share-modal";

type Props = {
  user: ProfileCardProps["user"];
  board: { cards: ValidCard[] };
  url: string;
  isMine: boolean;
  isLogin: boolean;
};

export function BoardPage({ user, board, url, isMine, isLogin }: Props) {
  const { t } = useTranslation();
  const shareRef = useRef<HTMLDialogElement>(null);
  const [saved, setSaved] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const openShare = (saved: boolean) => {
    setSaved(saved);
    shareRef.current?.showModal();
  };

  useEffect(() => {
    if (!searchParams.has("success")) return;
    setSaved(true);
    shareRef.current?.showModal();
    setSearchParams(
      (prev) => {
        prev.delete("success");
        return prev;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);

  const actions = (
    <>
      {isMine ? (
        <Link
          className="btn btn-primary"
          to="/edit"
          data-testid="profile-card__edit"
        >
          <PencilSquareIcon className="size-6" />
          {t("board-page.edit-button")}
        </Link>
      ) : (
        <a
          className="btn-bluesky btn text-white"
          href={`https://bsky.app/profile/${user.handle}`}
          target="_blank"
          rel="noreferrer"
          data-umami-event="click-bsky-link"
          data-umami-event-handle={user.handle}
        >
          <BlueskyIcon className="size-6" />
          Bluesky
        </a>
      )}
      <BoardMenu isLogin={isLogin} onShare={() => openShare(false)} />
    </>
  );

  return (
    <Main className="flex flex-col">
      <BoardViewer user={user} board={board} profileActions={actions} />
      <BoardFooter showCreateLink={!isLogin && !isMine} />
      <ShareModal
        ref={shareRef}
        url={url}
        title={
          saved ? t("share-modal.saved-title") : t("share-modal.share-title")
        }
        shareText={
          saved
            ? t("share-modal.saved-share-text", { url })
            : t("share-modal.board-share-text", {
                url,
                displayName: user.displayName,
              })
        }
      />
    </Main>
  );
}
