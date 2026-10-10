import { asDid } from "@atproto/did";

import { Owner, ownerViewFromDid } from "./owner";

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

describe("ownerViewFromDid", () => {
  test("URLと表示にDIDを使い、表示名とアバターはnullにする", () => {
    // arrange
    const did = asDid("did:plc:dummy");
    // act
    const actual = ownerViewFromDid(did);
    // assert
    expect(actual).toEqual({
      did: "did:plc:dummy",
      handleOrDid: "did:plc:dummy",
      displayHandle: "@did:plc:dummy",
      displayName: null,
      avatarUrl: null,
    });
  });
});
