import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";

import { BlueskyIcon } from "~/components/icons/bluesky";
import type { OwnerView } from "~/server/service/owner/ownerView";

import { BoardMenu } from "./board-menu";
import { ShareModal } from "./share-modal";

type Props = {
  owner: OwnerView;
  url: string;
  isMine: boolean;
  isLogin: boolean;
  onModerate: (() => void) | null;
};

export function BoardActions({
  owner,
  url,
  isMine,
  isLogin,
  onModerate,
}: Props) {
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

  return (
    <>
      {isMine ? (
        <Link
          className="btn btn-primary"
          to="/edit"
          data-testid="profile-card__edit"
        >
          <PencilSquareIcon className="size-6" />
          {t("board-actions.edit-button")}
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
      <BoardMenu
        isLogin={isLogin}
        onShare={() => openShare(false)}
        onModerate={onModerate}
      />
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
    </>
  );
}
