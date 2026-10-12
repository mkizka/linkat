import type { ValidCard } from "~/models/card";
import type { OwnerView } from "~/server/service/owner/ownerView";

import { ProfileCard } from "./card/profile-card";
import { ViewCardList } from "./card/view-card-list";

type Props = {
  owner: OwnerView;
  // loaderDataはシリアライズされるためプレーンなデータ構造で受け取る
  board: { cards: ValidCard[] } | null;
  url: string;
  isMine?: boolean;
};

export function BoardViewer({ owner, board, url, isMine }: Props) {
  return (
    <div className="flex flex-col gap-2 py-4">
      <ProfileCard owner={owner} url={url} showEditButton={isMine} />
      <ViewCardList cards={board?.cards ?? []} />
    </div>
  );
}
