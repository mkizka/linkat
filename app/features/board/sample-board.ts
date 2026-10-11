import { useTranslation } from "react-i18next";

import type { ValidCard } from "~/models/card";
import type { OwnerView } from "~/server/service/owner/ownerView";

export const useSampleBoard = () => {
  const { t } = useTranslation();
  const owner: OwnerView = {
    did: "did:plc:z72i7hdynmk6r22z27h6tvur",
    handleOrDid: "bsky.app",
    displayHandle: "@bsky.app",
    displayName: t("sample.owner-name"),
    avatarUrl: null,
  };
  const cards: ValidCard[] = [
    {
      url: "https://example.com",
    },
    {
      url: "https://example.com",
      text: t("sample.you-can-write-text-instead-of-url"),
    },
    {
      text: t("sample.you-can-write-only-text"),
    },
    {
      text: t("sample.bluesky-url-is-embedded"),
    },
    {
      url: "https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur/post/3l47prg3wgy23",
    },
  ];
  return { owner, cards };
};
