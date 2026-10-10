import { asDid } from "@atproto/did";

import { Owner } from "~/models/owner";

import { ownerViewServiceFactory } from "./ownerView";

const ownerViewService = ownerViewServiceFactory();

const did = asDid("did:plc:dummy");

const createOwner = (props: Partial<ConstructorParameters<typeof Owner>[0]>) =>
  new Owner({
    did,
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

describe("ownerViewService.toOwnerView", () => {
  test("ハンドルがあればURLと表示にハンドルを使う", () => {
    // arrange
    const owner = createOwner({ handle: "example.com" });
    // act
    const actual = ownerViewService.toOwnerView(did, owner);
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
    const actual = ownerViewService.toOwnerView(did, owner);
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
    const actual = ownerViewService.toOwnerView(did, owner).avatarUrl;
    // assert
    expect(actual).toBe(
      "https://cdn.bsky.app/img/avatar/plain/did:plc:dummy/bafkreiavatar@jpeg",
    );
  });
  test("写しが無ければURLと表示にDIDを使い、表示名とアバターはnullにする", () => {
    // arrange
    const owner = null;
    // act
    const actual = ownerViewService.toOwnerView(did, owner);
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
