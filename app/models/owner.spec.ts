import { Owner } from "./owner";

const createOwner = (props: Partial<ConstructorParameters<typeof Owner>[0]>) =>
  new Owner({
    did: "did:plc:dummy",
    avatarCid: null,
    description: null,
    displayName: null,
    handle: "example.com",
    active: true,
    status: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...props,
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
    active   | expected
    ${true}  | ${false}
    ${false} | ${true}
  `(
    "active=$active",
    ({ active, expected }: { active: boolean; expected: boolean }) => {
      expect(createOwner({ active }).isHidden()).toBe(expected);
    },
  );
});

describe("withProfile", () => {
  test("nullを渡すとプロフィールを空にし、ハンドルと状態は残す", () => {
    // arrange
    const owner = createOwner({
      avatarCid: "bafkreidummy",
      description: "説明",
      displayName: "Alice",
      active: false,
      status: "suspended",
    });
    // act
    const actual = owner.withProfile(null);
    // assert
    expect(actual).toMatchObject({
      avatarCid: null,
      description: null,
      displayName: null,
      handle: "example.com",
      active: false,
      status: "suspended",
    });
  });
});
