import type { ValidCard } from "~/models/card";

import { ViewCard } from "./view-card";

type Props = {
  cards: ValidCard[];
};

export function ViewCardList({ cards }: Props) {
  return (
    <ul className="flex flex-col gap-2">
      {cards.map((card, index) => (
        <li key={index} data-testid="board-card">
          <ViewCard card={card} />
        </li>
      ))}
    </ul>
  );
}
