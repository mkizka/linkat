import type { Did } from "@atproto/did";

import { type AccountStatus, getAvatarUrl, User } from "./user";

const createUser = (props: Partial<ConstructorParameters<typeof User>[0]>) =>
  new User({
    did: "did:plc:dummy",
    avatar: null,
    avatarCid: null,
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

describe("getAvatarUrl", () => {
  test("アバターのCIDからBlueskyのCDNのURLを返す", () => {
    // arrange
    const user = createUser({ avatarCid: "bafkreiavatar" });
    // act
    const actual = getAvatarUrl(user);
    // assert
    expect(actual).toBe(
      "https://cdn.bsky.app/img/avatar/plain/did:plc:dummy/bafkreiavatar@jpeg",
    );
  });
  test("アバターのCIDが無ければ移行前のアバターのURLを返す", () => {
    // arrange
    const user = createUser({
      avatar: "https://example.com/avatar.png",
      avatarCid: null,
    });
    // act
    const actual = getAvatarUrl(user);
    // assert
    expect(actual).toBe("https://example.com/avatar.png");
  });
  test("アバターが無ければnullを返す", () => {
    // arrange
    const user = createUser({ avatarCid: null });
    // act
    const actual = getAvatarUrl(user);
    // assert
    expect(actual).toBeNull();
  });
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
