import { useTranslation } from "react-i18next";

import { Card } from "~/components/card";
import { Footer, Main } from "~/components/layout";
import type { ValidCard } from "~/models/card";
import type { OwnerView } from "~/models/owner";

import { BoardViewer } from "./board-viewer";
import { ShareModal } from "./share-modal";

type Props = {
  owner: OwnerView;
  board: { cards: ValidCard[] };
  url: string;
  isMine: boolean;
};

export function BoardPage({ owner, board, url, isMine }: Props) {
  return (
    <>
      <Main>
        <BoardViewer owner={owner} board={board} url={url} isMine={isMine} />
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
