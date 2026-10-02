import { http, HttpResponse } from "msw";

import { server } from "~/mocks/server";

import { identityResolverFactory } from "./identityResolver";

const did = "did:plc:dfbe2uvzisfdxwscnwcxdta6";

const resolveHandleUrl =
  "https://handle.example.com/xrpc/com.atproto.identity.resolveHandle";

const plcUrl = `https://plc.example.com/${encodeURIComponent(did)}`;

const didDocument = (handle: string) => ({
  id: did,
  alsoKnownAs: [`at://${handle}`],
});

describe("identityResolver", () => {
  describe("resolveHandle", () => {
    test("handleをDIDに解決できる", async () => {
      // arrange
      server.use(
        http.get(resolveHandleUrl, () => HttpResponse.json({ did })),
        http.get(plcUrl, () => HttpResponse.json(didDocument("example.com"))),
      );
      // act
      const actual =
        await identityResolverFactory().resolveHandle("example.com");
      // assert
      expect(actual).toEqual({ status: "resolved", did });
    });
    test("handleが存在しないときnotFoundを返す", async () => {
      // arrange
      server.use(
        http.get(resolveHandleUrl, () =>
          HttpResponse.json(
            { error: "InvalidRequest", message: "Unable to resolve handle" },
            { status: 400 },
          ),
        ),
      );
      // act
      const actual =
        await identityResolverFactory().resolveHandle("example.com");
      // assert
      expect(actual).toEqual({ status: "notFound" });
    });
    test("DIDドキュメントにhandleが無いときnotFoundを返す", async () => {
      // arrange
      server.use(
        http.get(resolveHandleUrl, () => HttpResponse.json({ did })),
        http.get(plcUrl, () => HttpResponse.json(didDocument("other.com"))),
      );
      // act
      const actual =
        await identityResolverFactory().resolveHandle("example.com");
      // assert
      expect(actual).toEqual({ status: "notFound" });
    });
    test("DIDが存在しないときnotFoundを返す", async () => {
      // arrange
      server.use(
        http.get(resolveHandleUrl, () => HttpResponse.json({ did })),
        http.get(plcUrl, () => new HttpResponse(null, { status: 404 })),
      );
      // act
      const actual =
        await identityResolverFactory().resolveHandle("example.com");
      // assert
      expect(actual).toEqual({ status: "notFound" });
    });
    test("handleの解決に一時的に失敗したときunavailableを返す", async () => {
      // arrange
      server.use(
        http.get(
          resolveHandleUrl,
          () => new HttpResponse(null, { status: 500 }),
        ),
      );
      // act
      const actual =
        await identityResolverFactory().resolveHandle("example.com");
      // assert
      expect(actual).toEqual({ status: "unavailable" });
    });
    test("DIDの解決に一時的に失敗したときunavailableを返す", async () => {
      // arrange
      server.use(
        http.get(resolveHandleUrl, () => HttpResponse.json({ did })),
        http.get(plcUrl, () => new HttpResponse(null, { status: 500 })),
      );
      // act
      const actual =
        await identityResolverFactory().resolveHandle("example.com");
      // assert
      expect(actual).toEqual({ status: "unavailable" });
    });
  });
});
