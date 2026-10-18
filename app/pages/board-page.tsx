import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Card } from "~/components/card";
import { Footer, Main } from "~/components/layout";
import { BoardActions } from "~/features/board/board-actions";
import { BoardViewer } from "~/features/board/board-viewer";
import type { BoardCard } from "~/schemas/board";
import type { OwnerView } from "~/server/service/owner/ownerView";

type Props = {
  owner: OwnerView;
  board: { cards: BoardCard[] };
  url: string;
  isMine: boolean;
  isLogin: boolean;
};

export function BoardPage({ owner, board, url, isMine, isLogin }: Props) {
  const { t } = useTranslation();
  return (
    <>
      <Main className="flex flex-col gap-4 pb-4">
        <BoardViewer
          owner={owner}
          board={board}
          profileActions={
            <BoardActions
              owner={owner}
              url={url}
              isMine={isMine}
              isLogin={isLogin}
            />
          }
        />
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
