import { Footer, Main } from "~/components/layout";
import { BoardViewer } from "~/features/board/board-viewer";
import { ShareModal } from "~/features/board/share-modal";
import { i18nServer } from "~/i18n/i18n";
import { getSessionUserDid } from "~/server/oauth/session";
import { boardService } from "~/server/service/boardService";
import { userService } from "~/server/service/userService";
import { env } from "~/utils/env";
import { createMeta } from "~/utils/meta";

import type { Route } from "./+types/$handle";

const notFound = () => {
  throw new Response("Not Found", { status: 404 });
};

export async function loader({ request, params }: Route.LoaderArgs) {
  // この順で処理した場合ボードを持たない(=このサービスのユーザーでない)ユーザーの
  // データも作られてしまうが、一旦このままにしておく
  const user = await userService.findOrFetchUser({
    handleOrDid: params.handle,
  });
  if (!user) {
    return notFound();
  }
  const board = await boardService.findOrFetchBoard(user.did);
  if (!board) {
    return notFound();
  }
  const t = await i18nServer.getFixedT(request);
  const title = t("board.meta-title", {
    displayName: user.displayName,
    handle: user.handle,
  });
  return {
    user,
    board,
    isMine: user.did === (await getSessionUserDid(request)),
    title: `${title} | Linkat`,
    url: `${env.PUBLIC_URL}/${user.handle}`,
    ogImageUrl: `${env.PUBLIC_URL}/${user.handle}/og`,
    atUri: `at://${user.did}/blue.linkat.board/self`,
  };
}

export const meta: Route.MetaFunction = ({ data }) => {
  if (!data) {
    return [];
  }
  const { title, url, ogImageUrl, atUri } = data;
  return createMeta({ title, url, ogImageUrl, atUri });
};

export default function Index({ loaderData }: Route.ComponentProps) {
  const { user, board, url, isMine } = loaderData;
  return (
    <>
      <Main>
        <BoardViewer user={user} board={board} url={url} isMine={isMine} />
        <ShareModal url={url} />
      </Main>
      <Footer withNavigation />
    </>
  );
}
