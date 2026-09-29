import type { Did } from "@atproto/did";

import { User } from "./user";

const createUser = (props: Partial<ConstructorParameters<typeof User>[0]>) =>
  new User({
    did: "did:plc:dummy",
    avatar: null,
    description: null,
    displayName: null,
    handle: "example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...props,
  });

describe("isOwnedBy", () => {
  test.each`
    did                | viewerDid          | expected | description
    ${"did:plc:dummy"} | ${"did:plc:dummy"} | ${true}  | ${"同じDID"}
    ${"did:plc:dummy"} | ${"did:plc:other"} | ${false} | ${"異なるDID"}
    ${"did:plc:dummy"} | ${null}            | ${false} | ${"未ログイン"}
  `(
    "$description",
    ({
      did,
      viewerDid,
      expected,
    }: {
      did: Did;
      viewerDid: Did | null;
      expected: boolean;
    }) => {
      expect(createUser({ did }).isOwnedBy(viewerDid)).toBe(expected);
    },
  );
});
