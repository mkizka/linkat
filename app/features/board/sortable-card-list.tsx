import { arrayMoveImmutable } from "array-move";
import type { Dispatch, SetStateAction } from "react";
import SortableList, { SortableItem } from "react-easy-sort";

import type { SortableCardProps } from "./sortable-card";
import { SortableCard } from "./sortable-card";

const containerClass = "grid grid-cols-1 gap-2";

type CardStateValue = SortableCardProps["card"][];

type Props = {
  cards: CardStateValue;
  setCards: Dispatch<SetStateAction<CardStateValue>>;
  sortable?: boolean;
};

export function SortableCardList({ cards, setCards, sortable }: Props) {
  const onSortEnd = (oldIndex: number, newIndex: number) => {
    setCards((cards) => arrayMoveImmutable(cards, oldIndex, newIndex));
  };

  return (
    <SortableList
      lockAxis="y"
      onSortEnd={onSortEnd}
      draggedItemClassName="ring ring-primary"
      className={containerClass}
      allowDrag={sortable}
    >
      {cards.map((card) => (
        <SortableItem key={card.id}>
          <SortableCard card={card} sortable={sortable} />
        </SortableItem>
      ))}
    </SortableList>
  );
}
