import { useTranslation } from "react-i18next";

import { BoardPage } from "~/features/board/board-page";
import { di } from "~/server/di";
import { env } from "~/utils/env";

import type { Route } from "./+types/sample";

export async function loader({ request }: Route.LoaderArgs) {
  const userDid = await di.sessionService.getSessionUserDid(request);
  return {
    url: `${env.PUBLIC_URL}/sample`,
    isLogin: userDid !== null,
  };
}

export default function Index({
  loaderData: { url, isLogin },
}: Route.ComponentProps) {
  const { t } = useTranslation();
  return (
    <BoardPage
      url={url}
      isMine={false}
      isLogin={isLogin}
      user={{
        avatar: null,
        description: null,
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
  );
}
