import { useTranslation } from "react-i18next";

import { Card } from "~/components/card";
import { Footer, Main } from "~/components/layout";
import { BoardViewer } from "~/features/board/board-viewer";
import { ShareModal } from "~/features/board/share-modal";
import { getInstance } from "~/i18n/i18n";
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
  if (owner.isHidden()) {
    return { hidden: true as const, status: owner.status };
  }
  const board = await di.boardService.findBoard(owner.did);
  if (!board) {
    return notFound();
  }
  const view = owner.toView();
  const i18next = getInstance(context);
  const title = i18next.t("board.meta-title", {
    displayName: owner.displayName,
    handle: view.handleOrDid,
  });
  const ownerDid = await di.sessionService.getSessionDid(request);
  return {
    owner: view,
    board: { cards: board.cards },
    isMine: owner.isOwnedBy(ownerDid),
    title: `${title} | Linkat`,
    url: `${env.PUBLIC_URL}/${view.handleOrDid}`,
    ogImageUrl: `${env.PUBLIC_URL}/${view.handleOrDid}/og`,
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

function HiddenBoard({ status }: { status: string | null }) {
  const { t } = useTranslation();
  return (
    <>
      <Main className="utils--center">
        <Card>
          <div className="card-body">
            <p data-testid="hidden-board__message">
              {t("board.hidden-message")}
              {status && `: ${status}`}
            </p>
          </div>
        </Card>
      </Main>
      <Footer withNavigation />
    </>
  );
}

export default function Index({ loaderData }: Route.ComponentProps) {
  if (loaderData.hidden) {
    return <HiddenBoard status={loaderData.status} />;
  }
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
