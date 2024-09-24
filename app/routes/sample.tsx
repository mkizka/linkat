import { Footer, Main } from "~/components/layout";
import { BoardViewer } from "~/features/board/board-viewer";

export default function Index() {
  return (
    <>
      <Main>
        <BoardViewer
          user={{
            avatar: null,
            displayName: "サンプル",
            handle: "bsky.app",
          }}
          board={{
            cards: [
              {
                url: "https://bsky.app",
              },

              {
                url: "https://bsky.app",
                text: "URLの代わりにテキストも書ける",
              },
              {
                text: "テキストだけでもOK",
              },
              {
                text: "BlueskyのURLは自動で埋め込まれます ↓",
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
