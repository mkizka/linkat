import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";

import { Card } from "~/components/card";
import { BlueskyIcon } from "~/components/icons/bluesky";
import { Main } from "~/components/layout";
import { BoardFooter } from "~/features/board/board-footer";
import { BoardMenu } from "~/features/board/board-menu";
import { BoardViewer } from "~/features/board/board-viewer";
import { ShareModal } from "~/features/board/share-modal";
import type { ValidCard } from "~/models/card";
import type { OwnerView } from "~/server/service/owner/ownerView";

type Props = {
  owner: OwnerView;
  board: { cards: ValidCard[] };
  url: string;
  isMine: boolean;
  isLogin: boolean;
};

export function BoardPage({ owner, board, url, isMine, isLogin }: Props) {
  const { t } = useTranslation();
  const shareRef = useRef<HTMLDialogElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [saved, setSaved] = useState(() => searchParams.has("success"));

  const openShare = (saved: boolean) => {
    setSaved(saved);
    shareRef.current?.showModal();
  };

  useEffect(() => {
    if (!searchParams.has("success")) return;
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
          href={`https://bsky.app/profile/${owner.handleOrDid}`}
          target="_blank"
          rel="noreferrer"
          data-umami-event="click-bsky-link"
          data-umami-event-handle={owner.handleOrDid}
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
      <BoardViewer owner={owner} board={board} profileActions={actions} />
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
                displayName: owner.displayName,
              })
        }
      />
    </Main>
  );
}

export function HiddenBoardPage({ status }: { status: string | null }) {
  const { t } = useTranslation();
  return (
    <>
      <Main className="utils--center">
        <Card>
          <div className="card-body">
            <p data-testid="hidden-board__message">
              {t("board.hidden-message")}
              {status && `: ${status}`}
            </p>
          </div>
        </Card>
      </Main>
      <BoardFooter showCreateLink={false} />
    </>
  );
}
