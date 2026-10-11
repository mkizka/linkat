import type { ValidCard } from "~/models/card";

import type { ProfileCardProps } from "./card/profile-card";
import { ProfileCard } from "./card/profile-card";
import { SortableCardList } from "./card/sortable-card-list";

type Props = {
  user: ProfileCardProps["user"];
  // loaderDataはシリアライズされるためプレーンなデータ構造で受け取る
  board: { cards: ValidCard[] } | null;
  url: string;
  isMine?: boolean;
};

export function BoardViewer({ user, board, url, isMine }: Props) {
  const cards = (board?.cards ?? []).map((card, index) => ({
    ...card,
    id: String(index),
  }));
  return (
    <div className="flex flex-col gap-2 py-4">
      <ProfileCard user={user} url={url} showEditButton={isMine} />
      <SortableCardList cards={cards} />
    </div>
  );
}
