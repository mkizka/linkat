import { defineUserFactory } from "~/.server/generated/fabbrica";

export const UserFactory = defineUserFactory({
  defaultData: ({ seq }) => ({
    did: `did:plc:${seq}`,
    handle: `test${seq}.example.com`,
  }),
});
