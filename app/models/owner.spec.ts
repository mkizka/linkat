import type { Did } from "@atproto/did";

import { type AccountStatus, Owner } from "./owner";

const createOwner = (props: Partial<ConstructorParameters<typeof Owner>[0]>) =>
  new Owner({
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
      expect(createOwner({ did }).isOwnedBy(viewerDid)).toBe(expected);
    },
  );
});

describe("toView", () => {
  test("ハンドルがあればURLと表示にハンドルを使う", () => {
    // arrange
    const owner = createOwner({ handle: "example.com" });
    // act
    const actual = owner.toView();
    // assert
    expect(actual).toMatchObject({
      handleOrDid: "example.com",
      displayHandle: "@example.com",
    });
  });
  test("ハンドルがnullならURLと表示にDIDを使う", () => {
    // arrange
    const owner = createOwner({ handle: null });
    // act
    const actual = owner.toView();
    // assert
    expect(actual).toMatchObject({
      handleOrDid: "did:plc:dummy",
      displayHandle: "@did:plc:dummy",
    });
  });
  test("アバターのCIDからBlueskyのCDNのURLを返す", () => {
    // arrange
    const owner = createOwner({ avatarCid: "bafkreiavatar" });
    // act
    const actual = owner.toView().avatarUrl;
    // assert
    expect(actual).toBe(
      "https://cdn.bsky.app/img/avatar/plain/did:plc:dummy/bafkreiavatar@jpeg",
    );
  });
  test("アバターのCIDが無ければ移行前のアバターのURLを返す", () => {
    // arrange
    const owner = createOwner({
      avatar: "https://example.com/avatar.png",
      avatarCid: null,
    });
    // act
    const actual = owner.toView().avatarUrl;
    // assert
    expect(actual).toBe("https://example.com/avatar.png");
  });
  test("アバターが無ければnullを返す", () => {
    // arrange
    const owner = createOwner({ avatarCid: null });
    // act
    const actual = owner.toView().avatarUrl;
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
    ${"inactive"}    | ${true}
  `(
    "$status",
    ({ status, expected }: { status: AccountStatus; expected: boolean }) => {
      expect(createOwner({ status }).isHidden()).toBe(expected);
    },
  );
});
