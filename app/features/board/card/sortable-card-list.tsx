import { arrayMove, List } from "react-movable";

import type { ValidCard } from "~/models/card";

import { SortableCard } from "./sortable-card";

type CardStateValue = (ValidCard & { id: string })[];

type Props = {
  cards: CardStateValue;
  onChange?: (cards: CardStateValue) => void;
};

export function SortableCardList({ cards, onChange }: Props) {
  return (
    <List
      values={cards}
      lockVertically
      disabled={!onChange}
      onChange={({ oldIndex, newIndex }) =>
        onChange?.(arrayMove(cards, oldIndex, newIndex))
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
              sortable={!!onChange}
            />
          </li>
        );
      }}
    />
  );
}
