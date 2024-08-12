import { arrayMoveImmutable } from "array-move";
import type { Dispatch, SetStateAction } from "react";
import SortableList, { SortableItem } from "react-easy-sort";
import { useHydrated } from "remix-utils/use-hydrated";

import { SortableCard } from "./sortable-card";

const containerClass = "grid grid-cols-1 gap-2";

// TODO: Card型を整理する
type Card = {
  id: string;
  text: string;
  url?: string;
};

type Props = {
  cards: Card[];
  setCards: Dispatch<SetStateAction<Card[]>>;
};

export function Sortable({ cards, setCards }: Props) {
  const hydrated = useHydrated();

  const onSortEnd = (oldIndex: number, newIndex: number) => {
    setCards((cards) => arrayMoveImmutable(cards, oldIndex, newIndex));
  };

  if (!hydrated) {
    return (
      <div className={containerClass}>
        {cards.map((card) => (
          <SortableCard key={card.id} card={card} />
        ))}
      </div>
    );
  }

  return (
    <SortableList lockAxis="y" onSortEnd={onSortEnd} className={containerClass}>
      {cards.map((card) => (
        <SortableItem key={card.id}>
          <SortableCard card={card} sortable />
        </SortableItem>
      ))}
    </SortableList>
  );
}
