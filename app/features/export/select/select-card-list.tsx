import type { BoardCard } from "~/schemas/board";

import { SelectCard } from "./select-card";

type Props = {
  cards: BoardCard[];
  maxLinks: number;
  selected: number[];
  onChange: (selected: number[]) => void;
};

export function SelectCardList({ cards, maxLinks, selected, onChange }: Props) {
  const isFull = selected.length >= maxLinks;
  return (
    <ul className="flex flex-col gap-2">
      {cards.map((card, index) => {
        const isSelected = selected.includes(index);
        return (
          <li key={index}>
            <SelectCard
              card={card}
              isSelected={isSelected}
              disabled={!isSelected && isFull}
              onToggle={() =>
                onChange(
                  isSelected
                    ? selected.filter((i) => i !== index)
                    : [...selected, index].sort((a, b) => a - b),
                )
              }
            />
          </li>
        );
      })}
    </ul>
  );
}
