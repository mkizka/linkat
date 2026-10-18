import { useTranslation } from "react-i18next";

import { Card } from "~/components/card";
import { Footer, Main } from "~/components/layout";
import { BoardViewer } from "~/features/board/board-viewer";
import { ModerationPanel } from "~/features/board/moderation-panel";
import { ShareModal } from "~/features/board/share-modal";
import type { BoardCard } from "~/models/board";
import type { ModerationLevel } from "~/models/moderation";
import type { OwnerView } from "~/server/service/owner/ownerView";

type Props = {
  owner: OwnerView;
  board: { cards: BoardCard[] };
  url: string;
  isMine: boolean;
  moderation: { level: ModerationLevel | null } | null;
};

export function BoardPage({ owner, board, url, isMine, moderation }: Props) {
  const viewer = (
    <BoardViewer owner={owner} board={board} url={url} isMine={isMine} />
  );
  return (
    <>
      <Main className="flex flex-col">
        {moderation ? (
          <ModerationPanel
            did={owner.did}
            handle={owner.handleOrDid}
            level={moderation.level}
          >
            {viewer}
          </ModerationPanel>
        ) : (
          viewer
        )}
        <ShareModal url={url} />
      </Main>
      <Footer withNavigation />
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
      <Footer withNavigation />
    </>
  );
}
