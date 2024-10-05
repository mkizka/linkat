import type { AppBskyFeedGetFeedGenerator } from "@atproto/api";
import { useEffect, useState } from "react";

import { LinkatAgent } from "~/libs/agent";

type Props = {
  feedUri: string;
  url: string;
};

export function BlueskyFeed({ feedUri, url }: Props) {
  const [feed, setFeed] =
    useState<AppBskyFeedGetFeedGenerator.OutputSchema | null>(null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const agent = LinkatAgent.credential();
    agent.app.bsky.feed
      .getFeedGenerator({ feed: feedUri })
      .then((response) => {
        setFeed(response.data);
      })
      .catch((error: unknown) => {
        // eslint-disable-next-line no-console
        console.error(error);
        setShowError(true);
      });
  }, [feedUri]);

  if (showError) {
    return (
      <div className="card-body">
        <p>エラー！フィードを表示できませんでした</p>
      </div>
    );
  }
  if (!feed) {
    return (
      <div className="flex h-20 w-full items-center justify-center">
        <div className="loading loading-spinner size-8" />
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer">
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img src={feed.view.avatar} />
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate font-bold leading-snug">
              {feed.view.displayName}
            </p>
            <p className="truncate leading-snug text-gray-500">
              @{feed.view.creator.handle}によるフィード
            </p>
          </div>
        </div>
        <p className="whitespace-pre-line">{feed.view.description}</p>
      </div>
    </a>
  );
}
