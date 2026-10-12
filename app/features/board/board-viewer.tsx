import type { ValidCard } from "~/models/card";
import type { OwnerView } from "~/server/service/owner/ownerView";

import { ProfileCard } from "./card/profile-card";
import { ViewCard } from "./card/view-card";

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
      <ul className="flex flex-col gap-2">
        {board?.cards.map((card, index) => (
          <li key={index} data-testid="board-card">
            <ViewCard card={card} />
          </li>
        ))}
      </ul>
    </div>
  );
}
