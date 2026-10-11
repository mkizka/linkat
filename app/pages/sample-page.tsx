import { Footer, Main } from "~/components/layout";
import { BoardViewer } from "~/features/board/board-viewer";
import { useSampleBoard } from "~/features/board/sample-board";

type Props = {
  url: string;
};

export function SamplePage({ url }: Props) {
  const { owner, cards } = useSampleBoard();
  return (
    <>
      <Main>
        <BoardViewer url={url} owner={owner} board={{ cards }} />
      </Main>
      <Footer withNavigation />
    </>
  );
}
