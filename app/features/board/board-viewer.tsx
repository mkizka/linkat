import type { ReactNode } from "react";

import type { BoardCard } from "~/schemas/board";
import type { OwnerView } from "~/server/service/owner/ownerView";

import { ProfileCard } from "./card/profile-card";
import { ViewCardList } from "./card/view-card-list";

type Props = {
  owner: OwnerView;
  // loaderDataはシリアライズされるためプレーンなデータ構造で受け取る
  board: { cards: BoardCard[] } | null;
  profileActions?: ReactNode;
};

export function BoardViewer({ owner, board, profileActions }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <ProfileCard owner={owner} actions={profileActions} />
      <ViewCardList cards={board?.cards ?? []} />
    </div>
  );
}
