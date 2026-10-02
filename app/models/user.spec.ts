import type { Did } from "@atproto/did";

import { type AccountStatus, User } from "./user";

const createUser = (props: Partial<ConstructorParameters<typeof User>[0]>) =>
  new User({
    did: "did:plc:dummy",
    avatar: null,
    description: null,
    displayName: null,
    handle: "example.com",
    status: "active",
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

describe("isHidden", () => {
  test.each`
    status           | expected
    ${"active"}      | ${false}
    ${"suspended"}   | ${true}
    ${"deleted"}     | ${true}
    ${"deactivated"} | ${true}
  `(
    "$status",
    ({ status, expected }: { status: AccountStatus; expected: boolean }) => {
      expect(createUser({ status }).isHidden()).toBe(expected);
    },
  );
});
