import { Main, RootLayout } from "~/components/layout";
import { EditorMenu } from "~/features/top/editor-menu";
import { EditorProfile } from "~/features/top/editor-profile";
import { Hero } from "~/features/top/hero";
import { Reasons } from "~/features/top/reasons";
import { RecentBoards } from "~/features/top/recent-boards";
import { SampleBoardPreview } from "~/features/top/sample-board-preview";
import type { OwnerView } from "~/server/service/owner/ownerView";

type Props = {
  editor: OwnerView | null;
  hasBoard: boolean;
  experimental: boolean;
  recentOwners: OwnerView[];
};

export function TopPage({
  editor,
  hasBoard,
  experimental,
  recentOwners,
}: Props) {
  if (!editor) {
    return (
      <RootLayout>
        <Main className="flex flex-col gap-8 py-8">
          <Hero />
          <RecentBoards owners={recentOwners} />
          <SampleBoardPreview />
          <Reasons />
        </Main>
      </RootLayout>
    );
  }
  return (
    <RootLayout>
      <Main className="flex flex-col gap-8 py-8">
        <EditorProfile editor={editor} />
        <EditorMenu
          handle={editor.handleOrDid}
          hasBoard={hasBoard}
          experimental={experimental}
        />
        <div className="px-8">
          <RecentBoards owners={recentOwners} />
        </div>
      </Main>
    </RootLayout>
  );
}
