import {
  EllipsisHorizontalIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";

import { BlueskyIcon } from "~/components/icons/bluesky";
import { Main } from "~/components/layout";
import type { ValidCard } from "~/models/card";

import { BoardViewer } from "./board-viewer";
import type { ProfileCardProps } from "./card/profile-card";
import { ShareModal } from "./share-modal";

type MenuProps = {
  isLogin: boolean;
  onShare: () => void;
};

function Menu({ isLogin, onShare }: MenuProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const touchStartY = useRef(0);
  const { t } = useTranslation();

  const close = () => ref.current?.close();
  const links = isLogin
    ? [
        { to: "/following", label: t("board-page.following") },
        { to: "/settings", label: t("board-page.settings") },
        { to: "/", label: t("board-page.top") },
      ]
    : [{ to: "/", label: t("board-page.top") }];

  return (
    <>
      <button
        type="button"
        className="btn btn-square"
        aria-label={t("board-page.menu")}
        onClick={() => ref.current?.showModal()}
        data-testid="board-page__menu"
      >
        <EllipsisHorizontalIcon className="size-6" />
      </button>
      <dialog className="modal modal-bottom" ref={ref}>
        <div
          className="modal-box mx-auto max-w-screen-sm px-4 pt-3"
          onTouchStart={(e) => {
            touchStartY.current = e.touches[0]?.clientY ?? 0;
          }}
          onTouchEnd={(e) => {
            if (
              (e.changedTouches[0]?.clientY ?? 0) - touchStartY.current >
              50
            ) {
              close();
            }
          }}
        >
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-base-300" />
          <ul className="menu w-full text-base">
            <li>
              <button
                type="button"
                onClick={() => {
                  close();
                  onShare();
                }}
                data-testid="board-page__share"
              >
                {t("board-page.share")}
              </button>
            </li>
            {links.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}

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
      <Menu isLogin={isLogin} onShare={() => openShare(false)} />
    </>
  );

  return (
    <Main className="flex flex-col">
      <BoardViewer user={user} board={board} profileActions={actions} />
      {!isLogin && !isMine && (
        <Link to="/" className="btn mt-4" data-umami-event="click-create-link">
          {t("board-page.create-link")}
        </Link>
      )}
      <Link
        to="/"
        className="mx-auto py-6 text-sm font-bold text-base-content/60"
      >
        Linkat
      </Link>
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
