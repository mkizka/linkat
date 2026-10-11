import { Footer, Main } from "~/components/layout";
import { BoardViewer } from "~/features/board/board-viewer";
import { useSampleBoard } from "~/features/board/sample-board";
import { env } from "~/utils/env";

import type { Route } from "./+types/sample";

export function loader() {
  return {
    url: `${env.PUBLIC_URL}/sample`,
  };
}

export default function Index({ loaderData: { url } }: Route.ComponentProps) {
  const { user, cards } = useSampleBoard();
  return (
    <>
      <Main>
        <BoardViewer url={url} user={user} board={{ cards }} />
      </Main>
      <Footer withNavigation />
    </>
  );
}
