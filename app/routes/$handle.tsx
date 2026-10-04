import { useTranslation } from "react-i18next";

import { Card } from "~/components/card";
import { Footer, Main } from "~/components/layout";
import { BoardViewer } from "~/features/board/board-viewer";
import { ShareModal } from "~/features/board/share-modal";
import { getInstance } from "~/i18n/i18n";
import type { HiddenStatus } from "~/models/user";
import { di } from "~/server/di";
import { env } from "~/utils/env";
import { createMeta } from "~/utils/meta";

import type { Route } from "./+types/$handle";

const notFound = () => {
  throw new Response("Not Found", { status: 404 });
};

export async function loader({ request, params, context }: Route.LoaderArgs) {
  // この順で処理した場合ボードを持たない(=このサービスのユーザーでない)ユーザーの
  // データも作られてしまうが、一旦このままにしておく
  const user = await di.userService.findUser({
    handleOrDid: params.handle,
  });
  if (!user) {
    return notFound();
  }
  if (user.isHidden()) {
    return { hidden: true as const, status: user.status };
  }
  const board = await di.boardService.findBoard(user.did);
  if (!board) {
    return notFound();
  }
  const view = user.toView();
  const i18next = getInstance(context);
  const title = i18next.t("board.meta-title", {
    displayName: user.displayName,
    handle: view.handleOrDid,
  });
  const userDid = await di.sessionService.getSessionUserDid(request);
  return {
    user: view,
    board: { cards: board.cards },
    isMine: user.isOwnedBy(userDid),
    title: `${title} | Linkat`,
    url: `${env.PUBLIC_URL}/${view.handleOrDid}`,
    ogImageUrl: `${env.PUBLIC_URL}/${view.handleOrDid}/og`,
    atUri: `at://${user.did}/blue.linkat.board/self`,
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

function HiddenBoard({ status }: { status: HiddenStatus }) {
  const { t } = useTranslation();
  return (
    <>
      <Main className="utils--center">
        <Card>
          <div className="card-body">
            <p data-testid="hidden-board__message">
              {t(`board.hidden-message.${status}`)}
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
