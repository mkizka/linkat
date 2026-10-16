import { useTranslation } from "react-i18next";

import { BoardPage } from "./board-page";

type Props = {
  url: string;
  isLogin: boolean;
};

export function SamplePage({ url, isLogin }: Props) {
  const { t } = useTranslation();
  return (
    <BoardPage
      url={url}
      isMine={false}
      isLogin={isLogin}
      owner={{
        did: "did:plc:z72i7hdynmk6r22z27h6tvur",
        handleOrDid: "bsky.app",
        displayHandle: "@bsky.app",
        displayName: t("sample.owner-name"),
        avatarUrl: null,
        synced: true,
      }}
      board={{
        cards: [
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
        ],
      }}
    />
  );
}
