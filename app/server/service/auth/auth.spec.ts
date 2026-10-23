import { asDid } from "@atproto/did";
import { mock } from "vitest-mock-extended";

import {
  type IOAuthClient,
  OAuthCallbackFailedError,
} from "~/server/infrastructure/auth/oauthClient";

import { AuthCallbackError, authServiceFactory } from "./auth";

const oauthClient = mock<IOAuthClient>();

const authService = authServiceFactory({ oauthClient });

const did = asDid("did:plc:test");

describe("authService", () => {
  describe("handleCallback", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });
    test.each([
      ["/edit", "/edit"],
      ["/board/foo?a=1#b", "/board/foo?a=1#b"],
      [undefined, "/"],
      ["", "/"],
      ["edit", "/"],
      ["//evil.example", "/"],
      ["/\\evil.example", "/"],
      ["/\t/evil.example", "/"],
      ["http://[", "/"],
      ["https://evil.example/", "/"],
      ["javascript:alert(1)", "/"],
    ])("redirectが%sなら%sに戻す", async (redirect, expected) => {
      // arrange
      oauthClient.callback.mockResolvedValue({ did, redirect });
      // act
      const actual = await authService.handleCallback(
        "http://localhost/oauth/callback",
      );
      // assert
      expect(actual).toEqual({ did, redirectTo: expected });
    });
    test.each([
      ["/export", "/export", true],
      ["/login?redirect=/edit", "/login?redirect=/edit", false],
      ["https://evil.example/", "/", true],
      [undefined, "/", false],
    ])("失敗したときはfromが%sなら%sに戻す", async (from, expected, denied) => {
      // arrange
      oauthClient.callback.mockRejectedValue(
        new OAuthCallbackFailedError(from, denied, null),
      );
      // act
      const actual = authService.handleCallback(
        "http://localhost/oauth/callback",
      );
      // assert
      await expect(actual).rejects.toThrow(AuthCallbackError);
      await expect(actual).rejects.toMatchObject({
        returnTo: expected,
        denied,
      });
    });
  });
});
