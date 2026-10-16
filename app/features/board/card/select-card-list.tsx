import { MAX_EXPORT_CARDS, type ValidCard } from "~/models/card";

import { SelectCard } from "./select-card";

type Props = {
  cards: ValidCard[];
  selected: number[];
  onChange: (selected: number[]) => void;
};

export function SelectCardList({ cards, selected, onChange }: Props) {
  const isFull = selected.length >= MAX_EXPORT_CARDS;
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
