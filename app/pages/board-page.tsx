import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Card } from "~/components/card";
import { Footer, Main } from "~/components/layout";
import { BoardActions } from "~/features/board/board-actions";
import { BoardViewer } from "~/features/board/board-viewer";
import {
  ModerationBanner,
  ModerationDialog,
} from "~/features/board/moderation";
import type { BoardCard } from "~/schemas/board";
import type { ModerationLevelDto } from "~/server/infrastructure/moderation/moderationDto";
import type { OwnerView } from "~/server/service/owner/ownerView";

type Props = {
  owner: OwnerView;
  board: { cards: BoardCard[] };
  url: string;
  isMine: boolean;
  isLogin: boolean;
  admin: { moderationLevel: ModerationLevelDto } | null;
};

export function BoardPage({
  owner,
  board,
  url,
  isMine,
  isLogin,
  admin,
}: Props) {
  const { t } = useTranslation();
  const moderationRef = useRef<HTMLDialogElement>(null);
  const openModeration = () => moderationRef.current?.showModal();
  return (
    <>
      <Main className="flex flex-col gap-4 py-4">
        {admin && (
          <ModerationBanner
            level={admin.moderationLevel}
            onChange={openModeration}
          />
        )}
        <BoardViewer
          owner={owner}
          board={board}
          profileActions={
            <BoardActions
              owner={owner}
              url={url}
              isMine={isMine}
              isLogin={isLogin}
              onModerate={admin && openModeration}
            />
          }
        />
        {admin && (
          <ModerationDialog
            ref={moderationRef}
            ownerDid={owner.did}
            level={admin.moderationLevel}
          />
        )}
        {!isLogin && !isMine && (
          <Link
            to="/"
            className="btn mt-auto"
            data-umami-event="click-create-link"
          >
            {t("board-footer.create-link")}
          </Link>
        )}
      </Main>
      <Footer />
    </>
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
      <Footer />
    </>
  );
}
