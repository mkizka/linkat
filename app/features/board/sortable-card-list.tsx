import type { Dispatch, SetStateAction } from "react";
import { arrayMove, List } from "react-movable";

import { SortableCard, type SortableCardProps } from "./sortable-card";

type CardStateValue = SortableCardProps["card"][];

type Props = {
  cards: CardStateValue;
  setCards: Dispatch<SetStateAction<CardStateValue>>;
  sortable?: boolean;
};

export function SortableCardList({ cards, setCards, sortable }: Props) {
  return (
    <List
      values={cards}
      lockVertically
      disabled={!sortable}
      onChange={({ oldIndex, newIndex }) =>
        setCards(arrayMove(cards, oldIndex, newIndex))
      }
      renderList={({ children, props }) => (
        <ul {...props} className="grid grid-cols-1 gap-2">
          {children}
        </ul>
      )}
      renderItem={({ value, props, isDragged }) => (
        <li {...props} key={props.key} className="list-none">
          <SortableCard
            card={value}
            isDragging={isDragged}
            sortable={sortable}
          />
        </li>
      )}
    />
  );
}
