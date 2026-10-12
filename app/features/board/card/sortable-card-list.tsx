import { arrayMove, List } from "react-movable";

import { SortableCard } from "./sortable-card";
import type { CardWithId } from "./with-id";

type Props = {
  cards: CardWithId[];
  onChange: (cards: CardWithId[]) => void;
};

export function SortableCardList({ cards, onChange }: Props) {
  return (
    <List
      values={cards}
      lockVertically
      onChange={({ oldIndex, newIndex }) =>
        onChange(arrayMove(cards, oldIndex, newIndex))
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
            <SortableCard card={value} isDragging={isDragged} />
          </li>
        );
      }}
    />
  );
}
