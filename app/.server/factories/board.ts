import { defineBoardFactory } from "~/.server/generated/fabbrica";

import { UserFactory } from "./user";

export const BoardFactory = defineBoardFactory({
  defaultData: {
    user: UserFactory,
  },
});
