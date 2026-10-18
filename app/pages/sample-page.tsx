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
        did: "did:plc:example",
        handleOrDid: "example.bsky.social",
        displayHandle: "@example.bsky.social",
        displayName: t("sample.owner-name"),
        avatarUrl: null,
      }}
      board={{
        cards: [
          { url: "https://example.com" },
          { text: t("sample.text-only") },
          { url: "https://example.com", text: t("sample.text-and-url") },
          { url: "https://example.com", text: t("sample.emoji"), emoji: "📝" },
          {
            url: "https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur/post/3l6oveex3ii2l",
          },
          {
            url: "https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur/feed/whats-hot",
          },
        ],
      }}
    />
  );
}
