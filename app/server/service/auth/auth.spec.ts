import { asDid } from "@atproto/did";
import { mock } from "vitest-mock-extended";

import {
  type IOAuthClient,
  OAuthAccessDeniedError,
} from "~/server/infrastructure/auth/oauthClient";

import { authServiceFactory, ExportAuthorizationDeniedError } from "./auth";

const oauthClient = mock<IOAuthClient>();

const authService = authServiceFactory({ oauthClient });

const did = asDid("did:plc:test");
const url = "http://localhost/oauth/callback?code=code";

describe("authService", () => {
  describe("handleCallback", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });
    test("書き出しの再ログインから戻ったときはtoExportをtrueにする", async () => {
      // arrange
      oauthClient.callback.mockResolvedValue({ did, state: "export" });
      // act
      const actual = await authService.handleCallback(url);
      // assert
      expect(actual).toEqual({ did, toExport: true });
    });
    test("通常のログインから戻ったときはtoExportをfalseにする", async () => {
      // arrange
      oauthClient.callback.mockResolvedValue({ did, state: null });
      // act
      const actual = await authService.handleCallback(url);
      // assert
      expect(actual).toEqual({ did, toExport: false });
    });
    test("書き出しの再ログインで拒否されたときはExportAuthorizationDeniedErrorを投げる", async () => {
      // arrange
      oauthClient.callback.mockRejectedValue(
        new OAuthAccessDeniedError("export", null),
      );
      // act
      const actual = authService.handleCallback(url);
      // assert
      await expect(actual).rejects.toThrow(ExportAuthorizationDeniedError);
    });
    test("通常のログインで拒否されたときはそのまま投げる", async () => {
      // arrange
      oauthClient.callback.mockRejectedValue(
        new OAuthAccessDeniedError(null, null),
      );
      // act
      const actual = authService.handleCallback(url);
      // assert
      await expect(actual).rejects.toThrow(OAuthAccessDeniedError);
    });
  });
});
