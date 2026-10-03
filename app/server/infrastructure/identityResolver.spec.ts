import { http, HttpResponse } from "msw";

import { server } from "~/mocks/server";

import { identityResolverFactory } from "./identityResolver";

const DID = "did:plc:dfbe2uvzisfdxwscnwcxdta6";
const OTHER_DID = "did:plc:abcdefghijklmnopqrstuvwx";

const didDoc = (handle: string | null) => ({
  "@context": ["https://www.w3.org/ns/did/v1"],
  id: DID,
  alsoKnownAs: handle ? [`at://${handle}`] : [],
  service: [
    {
      id: "#atproto_pds",
      type: "AtprotoPersonalDataServer",
      serviceEndpoint: "https://pds.example.com",
    },
  ],
});

const resolveHandleUrl =
  "https://handle-resolver.example.com/xrpc/com.atproto.identity.resolveHandle";

const mockPlc = (response: () => Response) => {
  server.use(http.get("https://plc.example.com/:did", response));
};

const mockResolveHandle = (response: () => Response) => {
  server.use(http.get(resolveHandleUrl, response));
};

const unableToResolve = () =>
  HttpResponse.json(
    { error: "InvalidRequest", message: "Unable to resolve handle" },
    { status: 400 },
  );

describe("identityResolver", () => {
  let identityResolver: ReturnType<typeof identityResolverFactory>;
  beforeEach(() => {
    identityResolver = identityResolverFactory();
  });

  test("DIDからhandleを双方向に検証して返す", async () => {
    // arrange
    mockPlc(() => HttpResponse.json(didDoc("Alice.example.com")));
    mockResolveHandle(() => HttpResponse.json({ did: DID }));
    // act
    const actual = await identityResolver.resolve(DID);
    // assert
    expect(actual).toEqual({
      type: "found",
      identity: {
        did: DID,
        pds: "https://pds.example.com",
        handle: "alice.example.com",
      },
    });
  });
  test("handleからDIDを解決して返す", async () => {
    // arrange
    mockPlc(() => HttpResponse.json(didDoc("alice.example.com")));
    mockResolveHandle(() => HttpResponse.json({ did: DID }));
    // act
    const actual = await identityResolver.resolve("alice.example.com");
    // assert
    expect(actual).toEqual({
      type: "found",
      identity: {
        did: DID,
        pds: "https://pds.example.com",
        handle: "alice.example.com",
      },
    });
  });
  test("handleがhandle.invalidならnullにする", async () => {
    // arrange
    mockPlc(() => HttpResponse.json(didDoc("handle.invalid")));
    // act
    const actual = await identityResolver.resolve(DID);
    // assert
    expect(actual).toEqual({
      type: "found",
      identity: { did: DID, pds: "https://pds.example.com", handle: null },
    });
  });
  test("DIDドキュメントにhandleが無ければnullにする", async () => {
    // arrange
    mockPlc(() => HttpResponse.json(didDoc(null)));
    // act
    const actual = await identityResolver.resolve(DID);
    // assert
    expect(actual).toEqual({
      type: "found",
      identity: { did: DID, pds: "https://pds.example.com", handle: null },
    });
  });
  test("handleが別のDIDを指していればnullにする", async () => {
    // arrange
    mockPlc(() => HttpResponse.json(didDoc("alice.example.com")));
    mockResolveHandle(() => HttpResponse.json({ did: OTHER_DID }));
    // act
    const actual = await identityResolver.resolve(DID);
    // assert
    expect(actual).toEqual({
      type: "found",
      identity: { did: DID, pds: "https://pds.example.com", handle: null },
    });
  });
  test("handleを解決できなければnullにする", async () => {
    // arrange
    mockPlc(() => HttpResponse.json(didDoc("alice.example.com")));
    mockResolveHandle(unableToResolve);
    // act
    const actual = await identityResolver.resolve(DID);
    // assert
    expect(actual).toEqual({
      type: "found",
      identity: { did: DID, pds: "https://pds.example.com", handle: null },
    });
  });
  test("handleの検証が一時的な障害で失敗したらundefinedにする", async () => {
    // arrange
    mockPlc(() => HttpResponse.json(didDoc("alice.example.com")));
    mockResolveHandle(() => HttpResponse.json({}, { status: 500 }));
    // act
    const actual = await identityResolver.resolve(DID);
    // assert
    expect(actual).toEqual({
      type: "found",
      identity: { did: DID, pds: "https://pds.example.com", handle: undefined },
    });
  });
  test("DIDが存在しなければnotFoundを返す", async () => {
    // arrange
    mockPlc(() => HttpResponse.json({}, { status: 404 }));
    // act
    const actual = await identityResolver.resolve(DID);
    // assert
    expect(actual).toEqual({ type: "notFound" });
  });
  test("DIDの解決が一時的な障害で失敗したらunavailableを返す", async () => {
    // arrange
    mockPlc(() => HttpResponse.json({}, { status: 503 }));
    // act
    const actual = await identityResolver.resolve(DID);
    // assert
    expect(actual).toEqual({ type: "unavailable" });
  });
  test("handleを解決できなければnotFoundを返す", async () => {
    // arrange
    mockResolveHandle(unableToResolve);
    // act
    const actual = await identityResolver.resolve("notfound.example.com");
    // assert
    expect(actual).toEqual({ type: "notFound" });
  });
  test("handleの解決が一時的な障害で失敗したらunavailableを返す", async () => {
    // arrange
    mockResolveHandle(() => HttpResponse.json({}, { status: 500 }));
    // act
    const actual = await identityResolver.resolve("alice.example.com");
    // assert
    expect(actual).toEqual({ type: "unavailable" });
  });
});
