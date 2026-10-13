import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { BoardViewer } from "~/features/board/board-viewer";
import { FeedFetcherContext } from "~/features/board/card/bluesky-feed";
import type { OwnerView } from "~/server/service/owner/ownerView";

export function SampleBoardPreview() {
  const { t } = useTranslation();
  const owner: OwnerView = {
    did: "did:web:example.com",
    handleOrDid: "example.com",
    displayHandle: "@example.com",
    displayName: t("_index.sample-owner-name"),
    avatarUrl: null,
  };
  const cards = [
    { url: "https://example.com" },
    { text: t("_index.sample-text") },
    {
      url: "https://bsky.app/profile/did:plc:4gow62pk3vqpuwiwaslcwisa/post/3mxm6rvnfns25",
    },
    { url: "https://bsky.app/profile/example.com/feed/sample" },
  ];
  const fetchMockFeed = () =>
    Promise.resolve({
      displayName: t("_index.sample-feed-name"),
      description: t("_index.sample-feed-description"),
      creatorHandle: "example.com",
    });
  return (
    <div className="relative -rotate-2 px-4 [zoom:0.8]">
      <FeedFetcherContext value={fetchMockFeed}>
        <BoardViewer owner={owner} board={{ cards }} />
      </FeedFetcherContext>
      <Link
        to="/sample"
        className="absolute inset-0"
        aria-label={t("_index.sample-link")}
        data-umami-event="click-sample-preview"
      />
    </div>
  );
}
