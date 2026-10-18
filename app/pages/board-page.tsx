import { useTranslation } from "react-i18next";

import { Card } from "~/components/card";
import { Footer, Main } from "~/components/layout";
import { BoardViewer } from "~/features/board/board-viewer";
import { ModerationPanel } from "~/features/board/moderation-panel";
import { ShareModal } from "~/features/board/share-modal";
import type { BoardCard } from "~/schemas/board";
import type { ModerationLevelDto } from "~/server/infrastructure/moderation/moderationDto";
import type { OwnerView } from "~/server/service/owner/ownerView";

type Props = {
  owner: OwnerView;
  board: { cards: BoardCard[] };
  url: string;
  isMine: boolean;
  admin?: { moderationLevel: ModerationLevelDto };
};

export function BoardPage({ owner, board, url, isMine, admin }: Props) {
  const viewer = (
    <BoardViewer owner={owner} board={board} url={url} isMine={isMine} />
  );
  return (
    <>
      <Main className="flex flex-col">
        {admin ? (
          <ModerationPanel ownerDid={owner.did} level={admin.moderationLevel}>
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
