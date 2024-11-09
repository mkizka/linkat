import { LinkIcon } from "@heroicons/react/24/outline";
import type { ComponentProps, FC } from "react";

import { BlueskyIcon } from "~/components/icons/bluesky";
import { GitHubIcon } from "~/components/icons/github";
import { TwitterIcon } from "~/components/icons/twitter";
import type { ValidCard } from "~/models/card";
import {
  atUri,
  isBlueskyFeedUrl,
  isBlueskyPostUrl,
  isBlueskyProfileUrl,
  isGitHubProfileUrl,
  isTwitterProfileUrl,
} from "~/utils/url";

type CardIconComponent = FC<ComponentProps<"svg">>;

export type ParsedLinkCard = {
  type: "link";
  icon: CardIconComponent;
  text: string;
  url: string;
  emoji?: string;
};

export type ParsedTextCard = {
  type: "text";
  text: string;
  emoji?: string;
};

export type ParsedEmbedCard = {
  type: "embed";
  blueskyUri: string;
};

export type ParsedFeedCard = {
  type: "feed";
  feedUri: string;
  url: string;
};

type ParsedCard =
  | ParsedLinkCard
  | ParsedTextCard
  | ParsedEmbedCard
  | ParsedFeedCard;

const cardIcons: Record<string, CardIconComponent | undefined> = {
  "bsky.app": BlueskyIcon,
  "x.com": TwitterIcon,
  "twitter.com": TwitterIcon,
  "github.com": GitHubIcon,
};

export const parseCard = (card: ValidCard): ParsedCard => {
  if (!card.url) {
    return {
      type: "text",
      text: card.text || card.url || "",
      emoji: card.emoji,
    };
  }
  const url = new URL(card.url);
  const paths = url.pathname.split("/");
  if (isBlueskyFeedUrl(url)) {
    return {
      type: "feed",
      feedUri: atUri(url, "app.bsky.feed.generator"),
      url: card.url,
    };
  }
  if (isBlueskyPostUrl(url)) {
    return {
      type: "embed",
      blueskyUri: atUri(url, "app.bsky.feed.post"),
    };
  }
  if (isBlueskyProfileUrl(url)) {
    return {
      type: "link",
      icon: BlueskyIcon,
      text: card.text || `@${paths[2]}`,
      url: card.url,
    };
  }
  if (isTwitterProfileUrl(url)) {
    return {
      type: "link",
      icon: TwitterIcon,
      text: card.text || `@${paths[1]}`,
      url: card.url,
      emoji: card.emoji,
    };
  }
  if (isGitHubProfileUrl(url)) {
    return {
      type: "link",
      icon: GitHubIcon,
      text: card.text || `@${paths[1]}`,
      url: card.url,
      emoji: card.emoji,
    };
  }
  return {
    type: "link",
    icon: cardIcons[url.hostname] || LinkIcon,
    text: card.text || card.url,
    url: card.url,
    emoji: card.emoji,
  };
};
