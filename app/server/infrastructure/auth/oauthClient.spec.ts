import { asDid } from "@atproto/did";
import type {
  NodeSavedSessionStore,
  NodeSavedStateStore,
  OAuthSession,
} from "@atproto/oauth-client-node";
import {
  NodeOAuthClient,
  OAuthResponseError,
  TokenRefreshError,
} from "@atproto/oauth-client-node";
import { mock } from "vitest-mock-extended";

import { oauthClientFactory, OAuthSessionInvalidError } from "./oauthClient";

const oauthClient = oauthClientFactory({
  oauthStateStore: mock<NodeSavedStateStore>(),
  oauthSessionStore: mock<NodeSavedSessionStore>(),
});

const did = asDid("did:plc:test");

const oauthResponseError = (status: number, error: string) =>
  new OAuthResponseError(new Response(null, { status }), { error });

describe("oauthClient", () => {
  describe("restore", () => {
    test("復元できればセッションを返す", async () => {
      // arrange
      const session = mock<OAuthSession>({ did });
      vi.spyOn(NodeOAuthClient.prototype, "restore").mockResolvedValueOnce(
        session,
      );
      // act
      const actual = await oauthClient.restore(did);
      // assert
      expect(actual).toBe(session);
    });
    test.each([
      ["TokenRefreshError", new TokenRefreshError(did, "revoked")],
      ["TypeError", new TypeError("invalid stored session")],
      ["400 invalid_grant", oauthResponseError(400, "invalid_grant")],
      ["401 invalid_client", oauthResponseError(401, "invalid_client")],
    ])(
      "セッションが使えないエラー(%s)はOAuthSessionInvalidErrorにする",
      async (_, error) => {
        // arrange
        vi.spyOn(NodeOAuthClient.prototype, "restore").mockRejectedValueOnce(
          error,
        );
        // act
        const actual = oauthClient.restore(did);
        // assert
        await expect(actual).rejects.toThrow(OAuthSessionInvalidError);
        await expect(actual).rejects.toHaveProperty("cause", error);
      },
    );
    test.each([
      ["ネットワークエラー", new Error("fetch failed")],
      ["500 server_error", oauthResponseError(500, "server_error")],
      ["400 invalid_request", oauthResponseError(400, "invalid_request")],
    ])("一時的なエラー(%s)はそのまま投げる", async (_, error) => {
      // arrange
      vi.spyOn(NodeOAuthClient.prototype, "restore").mockRejectedValueOnce(
        error,
      );
      // act
      const actual = oauthClient.restore(did);
      // assert
      await expect(actual).rejects.toBe(error);
    });
  });
});
