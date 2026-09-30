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

describe("withHandle", () => {
  test("handleだけを差し替えたUserを返す", () => {
    // arrange
    const createdAt = new Date("2024-01-01T00:00:00.000Z");
    const user = createUser({ handle: "old.example.com", createdAt });
    // act
    const actual = user.withHandle("new.example.com");
    // assert
    expect(actual).toEqual(
      createUser({
        handle: "new.example.com",
        createdAt,
        updatedAt: user.updatedAt,
      }),
    );
  });
});

describe("handleOrDid", () => {
  test.each`
    handle              | expected           | description
    ${"example.com"}    | ${"example.com"}   | ${"有効なhandleならhandle"}
    ${"handle.invalid"} | ${"did:plc:dummy"} | ${"無効なhandleならDID"}
  `(
    "$description",
    ({ handle, expected }: { handle: string; expected: string }) => {
      // arrange
      const user = createUser({ handle });
      // act
      const actual = user.handleOrDid;
      // assert
      expect(actual).toBe(expected);
    },
  );
});
