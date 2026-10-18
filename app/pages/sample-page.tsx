import { useTranslation } from "react-i18next";

import { FeedFetcherContext } from "~/features/board/card/bluesky-feed";
import { useSampleBoard } from "~/features/sample/use-sample-board";

import { BoardPage } from "./board-page";

type Props = {
  url: string;
  isLogin: boolean;
};

export function SamplePage({ url, isLogin }: Props) {
  const { t } = useTranslation();
  const { owner, cards, fetchFeed } = useSampleBoard(t("sample.owner-name"));
  return (
    <FeedFetcherContext value={fetchFeed}>
      <BoardPage
        url={url}
        isMine={false}
        isLogin={isLogin}
        owner={owner}
        board={{ cards }}
      />
    </FeedFetcherContext>
  );
}
