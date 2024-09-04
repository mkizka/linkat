import { LinkIcon } from "@heroicons/react/24/outline";
import type { ComponentProps, FC } from "react";

import type { ValidCard } from "~/models/card";

import { BlueskyIcon } from "./icons/bluesky";
import { atUri, isBlueskyPostUrl, isBlueskyProfileUrl } from "./url";

type CardIconComponent = FC<ComponentProps<"svg">>;

export type ParsedLinkCard = {
  type: "link";
  icon: CardIconComponent;
  text: string;
  url: string;
};

export type ParsedTextCard = {
  type: "text";
  text: string;
};

export type ParsedEmbedCard = {
  type: "embed";
  blueskyUri: string;
};

type ParsedCard = ParsedLinkCard | ParsedTextCard | ParsedEmbedCard;

const cardIcons: Record<string, CardIconComponent | undefined> = {
  "bsky.app": BlueskyIcon,
  // "x.com": TwitterIcon,
  // "twitter.com": TwitterIcon,
  // "github.com": GitHubIcon,
};

export const parseCard = (card: ValidCard): ParsedCard => {
  if (!card.url) {
    return {
      type: "text",
      text: card.text || card.url || "",
    };
  }
  const url = new URL(card.url);
  const paths = url.pathname.split("/");
  if (isBlueskyPostUrl(url)) {
    return {
      type: "embed",
      blueskyUri: atUri(url),
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
  // if (isTwitterProfileUrl(url)) {
  //   return {
  //     type: "link",
  //     icon: TwitterIcon,
  //     text: card.text || `@${paths[1]}`,
  //     url: card.url,
  //   };
  // }
  // if (isGitHubProfileUrl(url)) {
  //   return {
  //     type: "link",
  //     icon: GitHubIcon,
  //     text: card.text || `@${paths[1]}`,
  //     url: card.url,
  //   };
  // }
  return {
    type: "link",
    icon: cardIcons[url.hostname] || LinkIcon,
    text: card.text || card.url,
    url: card.url,
  };
};
