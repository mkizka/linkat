import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { Footer, Main } from "~/components/layout";
import { BoardViewer } from "~/features/board/board-viewer";
import { i18nServer } from "~/i18n/i18n";
import { getSessionUserDid } from "~/server/oauth/session";
import { boardService } from "~/server/service/boardService";
import { userService } from "~/server/service/userService";
import { env } from "~/utils/env";
import { createMeta } from "~/utils/meta";
import { required } from "~/utils/required";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const maybeHandle = params.handle;
  if (!maybeHandle || !maybeHandle.includes(".")) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw new Response("Not Found", { status: 404 });
  }
  // この順で処理した場合ボードを持たない(=このサービスのユーザーでない)ユーザーの
  // データも作られてしまうが、一旦このままにしておく
  const user = await userService.findOrFetchUser({
    handleOrDid: maybeHandle,
  });
  if (!user) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw new Response(null, { status: 404 });
  }
  const board = await boardService.findOrFetchBoard(user.did);
  if (!board) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw new Response(null, { status: 404 });
  }
  const sessionUserDid = await getSessionUserDid(request);
  const t = await i18nServer.getFixedT(request);
  const title = t("board.meta-title", {
    displayName: user.displayName,
    handle: user.handle,
  });
  return {
    user,
    board,
    isMine: user.did === sessionUserDid,
    title: `${title} | Linkat`,
    url: `${env.PUBLIC_URL}/${user.handle}`,
  };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const { title, url } = required(data);
  return createMeta({
    title,
    url,
    ogImageUrl: `${url}/og.png`,
    canonicalUrl: url,
  });
};

export default function Index() {
  const { user, board, isMine } = useLoaderData<typeof loader>();
  return (
    <>
      <Main>
        <BoardViewer user={user} board={board} isMine={isMine} />
      </Main>
      <Footer withNavigation />
    </>
  );
}
