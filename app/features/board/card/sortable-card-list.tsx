import { arrayMove, List } from "react-movable";

import type { ValidCard } from "~/models/card";

import { SortableCard } from "./sortable-card";

type CardStateValue = (ValidCard & { id: string })[];

type Props = {
  cards: CardStateValue;
  setCards: (cards: CardStateValue) => void;
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
        <ul {...props} className="flex flex-col gap-2">
          {children}
        </ul>
      )}
      renderItem={({ value, props, isDragged }) => {
        const { key, ...rest } = props;
        return (
          <li
            key={key}
            {...rest}
            className="list-none"
            data-testid={`sortable-card`}
          >
            <SortableCard
              card={value}
              isDragging={isDragged}
              sortable={sortable}
            />
          </li>
        );
      }}
    />
  );
}
