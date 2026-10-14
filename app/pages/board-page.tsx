import { useTranslation } from "react-i18next";

import { Card } from "~/components/card";
import { Main } from "~/components/layout";
import { BoardActions } from "~/features/board/board-actions";
import { BoardFooter } from "~/features/board/board-footer";
import { BoardViewer } from "~/features/board/board-viewer";
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
  return (
    <Main className="flex flex-col">
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
      <BoardFooter showCreateLink={!isLogin && !isMine} />
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
