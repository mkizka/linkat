import { useTranslation } from "react-i18next";

import { Footer, Main } from "~/components/layout";
import { BoardViewer } from "~/features/board/board-viewer";

export default function Index() {
  const { t } = useTranslation();
  return (
    <>
      <Main>
        <BoardViewer
          user={{
            avatar: null,
            displayName: t("sample.user-name"),
            handle: "bsky.app",
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
      </Main>
      <Footer withNavigation />
    </>
  );
}
