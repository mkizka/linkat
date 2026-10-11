import { getInstance } from "~/i18n/i18n";
import { BoardPage, HiddenBoardPage } from "~/pages/board-page";
import { di } from "~/server/di";
import { env } from "~/utils/env";
import { createMeta } from "~/utils/meta";

import type { Route } from "./+types/$handle";

const notFound = () => {
  throw new Response("Not Found", { status: 404 });
};

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const result = await di.boardService.findBoardView(params.handle);
  if (result.type === "not-found") {
    return notFound();
  }
  if (result.type === "hidden") {
    return { hidden: true as const, status: result.status };
  }
  const { owner, board } = result;
  const i18next = getInstance(context);
  const title = i18next.t("board.meta-title", {
    displayName: owner.displayName,
    handle: owner.handleOrDid,
  });
  const viewerDid = await di.sessionService.getSessionDid(request);
  return {
    owner,
    board: { cards: board.cards },
    isMine: owner.did === viewerDid,
    title: `${title} | Linkat`,
    url: `${env.PUBLIC_URL}/${owner.handleOrDid}`,
    ogImageUrl: `${env.PUBLIC_URL}/${owner.handleOrDid}/og`,
    atUri: `at://${owner.did}/blue.linkat.board/self`,
    hidden: false as const,
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => {
  if (loaderData.hidden) {
    return [{ title: "Linkat" }];
  }
  const { title, url, ogImageUrl, atUri } = loaderData;
  return createMeta({ title, url, ogImageUrl, atUri });
};

export default function Index({ loaderData }: Route.ComponentProps) {
  if (loaderData.hidden) {
    return <HiddenBoardPage status={loaderData.status} />;
  }
  const { owner, board, url, isMine } = loaderData;
  return <BoardPage owner={owner} board={board} url={url} isMine={isMine} />;
}
