import { useTranslation } from "react-i18next";

import type { OwnerView } from "~/server/service/owner/ownerView";

export function useSampleBoard(displayName: string) {
  const { t } = useTranslation();
  const owner: OwnerView = {
    did: "did:web:example.com",
    handleOrDid: "example.com",
    displayHandle: "@example.com",
    displayName,
    avatarUrl: null,
  };
  const cards = [
    { url: "https://example.com" },
    { text: t("sample.text") },
    { url: t("sample.post-url") },
    { url: "https://bsky.app/profile/example.com/feed/sample" },
  ];
  const fetchFeed = () =>
    Promise.resolve({
      displayName: t("sample.feed-name"),
      description: t("sample.feed-description"),
      creatorHandle: "example.com",
    });
  return { owner, cards, fetchFeed };
}
