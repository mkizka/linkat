import { defineUserFactory } from "~/generated/fabbrica";

export const UserFactory = defineUserFactory({
  defaultData: ({ seq }) => ({
    did: `did:plc:${seq}`,
    handle: `test${seq}.example.com`,
  }),
});
