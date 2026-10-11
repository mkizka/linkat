import { Client } from "@atproto/lex";
import { asAtUriString } from "@atproto/syntax";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import getFeedGenerator from "~/generated/app/bsky/feed/getFeedGenerator";

type Feed = {
  avatar?: string;
  displayName: string;
  description?: string;
  creatorHandle: string;
};

type BlueskyFeedViewProps = {
  feed: Feed | null;
  error: boolean;
  url: string;
};

export function BlueskyFeedView({ feed, error, url }: BlueskyFeedViewProps) {
  const { t } = useTranslation();
  if (error) {
    return (
      <div className="card-body">
        <p>{t("bluesky-feed.error-message")}</p>
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
      <div className="card-body gap-2">
        <div className="flex items-center gap-2">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img src={feed.avatar} />
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate font-bold leading-snug">
              {feed.displayName}
            </p>
            <p className="truncate leading-snug text-gray-500">
              {t("bluesky-feed.creator-text", {
                handle: feed.creatorHandle,
              })}
            </p>
          </div>
        </div>
        <p className="whitespace-pre-line [overflow-wrap:break-word]">
          {feed.description}
        </p>
      </div>
    </a>
  );
}

type Props = {
  feedUri: string;
  url: string;
};

export function BlueskyFeed({ feedUri, url }: Props) {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const agent = new Client("https://public.api.bsky.app");
    agent
      .call(getFeedGenerator, { feed: asAtUriString(feedUri) })
      .then(({ view }) => {
        setFeed({
          avatar: view.avatar,
          displayName: view.displayName,
          description: view.description,
          creatorHandle: view.creator.handle,
        });
      })
      .catch((error: unknown) => {
        // eslint-disable-next-line no-console
        console.error(error);
        setShowError(true);
      });
  }, [feedUri]);

  return <BlueskyFeedView feed={feed} error={showError} url={url} />;
}
