import { defineBoardFactory } from "~/generated/fabbrica";

import { UserFactory } from "./user";

export const cardsFromFactory = [
  {
    url: "https://example.com",
    text: "Factoryで作成したカード",
  },
];

export const BoardFactory = defineBoardFactory({
  defaultData: {
    user: UserFactory,
    record: JSON.stringify({
      cards: cardsFromFactory,
    }),
  },
});
