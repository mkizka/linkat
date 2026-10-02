import { Footer, Main } from "~/components/layout";
import { BoardViewer } from "~/features/board/board-viewer";
import { ShareModal } from "~/features/board/share-modal";
import { getInstance } from "~/i18n/i18n";
import { getHandleOrDid } from "~/models/owner";
import { di } from "~/server/di";
import { env } from "~/utils/env";
import { createMeta } from "~/utils/meta";

import type { Route } from "./+types/$handle";

const notFound = () => {
  throw new Response("Not Found", { status: 404 });
};

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const owner = await di.ownerService.findOwner({
    handleOrDid: params.handle,
  });
  if (!owner) {
    return notFound();
  }
  const board = await di.boardService.findBoard(owner.did);
  if (!board) {
    return notFound();
  }
  const i18next = getInstance(context);
  const title = i18next.t("board.meta-title", {
    displayName: owner.displayName,
    handle: getHandleOrDid(owner),
  });
  const viewerDid = await di.sessionService.getSessionDid(request);
  return {
    owner,
    board: { cards: board.cards },
    isMine: owner.isOwnedBy(viewerDid),
    title: `${title} | Linkat`,
    url: `${env.PUBLIC_URL}/${getHandleOrDid(owner)}`,
    ogImageUrl: `${env.PUBLIC_URL}/${getHandleOrDid(owner)}/og`,
    atUri: `at://${owner.did}/blue.linkat.board/self`,
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const { title, url, ogImageUrl, atUri } = loaderData;
  return createMeta({ title, url, ogImageUrl, atUri });
};

export default function Index({ loaderData }: Route.ComponentProps) {
  const { owner, board, url, isMine } = loaderData;
  return (
    <>
      <Main>
        <BoardViewer owner={owner} board={board} url={url} isMine={isMine} />
        <ShareModal url={url} />
      </Main>
      <Footer withNavigation />
    </>
  );
}
