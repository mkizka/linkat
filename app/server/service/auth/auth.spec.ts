import { asDid } from "@atproto/did";
import { mock } from "vitest-mock-extended";

import type { IOAuthClient } from "~/server/infrastructure/auth/oauthClient";

import { authServiceFactory } from "./auth";

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
      [null, "/"],
      ["", "/"],
      ["edit", "/"],
      ["//evil.example", "/"],
      ["/\\evil.example", "/"],
      ["/\t/evil.example", "/"],
      ["http://[", "/"],
      ["https://evil.example/", "/"],
      ["javascript:alert(1)", "/"],
    ])("stateが%sなら%sに戻す", async (state, expected) => {
      // arrange
      oauthClient.callback.mockResolvedValue({ did, state });
      // act
      const actual = await authService.handleCallback(
        "http://localhost/oauth/callback",
      );
      // assert
      expect(actual).toEqual({ did, redirectTo: expected });
    });
  });
});
