import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { BoardViewer } from "~/features/board/board-viewer";
import { FeedFetcherContext } from "~/features/board/card/bluesky-feed";
import { useSampleBoard } from "~/features/sample/use-sample-board";

export function SampleBoardPreview() {
  const { t } = useTranslation();
  const { owner, cards, fetchFeed } = useSampleBoard(
    t("_index.sample-owner-name"),
  );
  return (
    <div className="relative -rotate-2 p-4 [zoom:0.8]">
      <FeedFetcherContext value={fetchFeed}>
        <BoardViewer owner={owner} board={{ cards }} />
      </FeedFetcherContext>
      <Link
        to="/sample"
        className="absolute inset-0"
        aria-label={t("_index.sample-link")}
      />
    </div>
  );
}
