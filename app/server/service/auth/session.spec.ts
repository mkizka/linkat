import { asDid } from "@atproto/did";
import type { OAuthSession } from "@atproto/oauth-client-node";
import { mock } from "vitest-mock-extended";

import type { ICookieSessionStorage } from "~/server/infrastructure/auth/cookieSessionStorage";
import {
  type IOAuthClient,
  OAuthSessionInvalidError,
} from "~/server/infrastructure/auth/oauthClient";
import type {
  IChildLogger,
  ILogger,
} from "~/server/infrastructure/logger/logger";

import { sessionServiceFactory } from "./session";

const cookieSessionStorage = mock<ICookieSessionStorage>();
const oauthClient = mock<IOAuthClient>();
const childLogger = mock<IChildLogger>();
const logger = mock<ILogger>();
logger.child.mockReturnValue(childLogger);

const sessionService = sessionServiceFactory({
  cookieSessionStorage,
  oauthClient,
  logger,
});

const did = asDid("did:plc:test");
const request = new Request("http://localhost/logout", {
  headers: { Cookie: "session=value" },
});

describe("sessionService", () => {
  describe("getSessionDid", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });
    test("OAuthセッションを復元できればDIDを返す", async () => {
      // arrange
      cookieSessionStorage.getDid.mockResolvedValue(did);
      oauthClient.restore.mockResolvedValue(mock<OAuthSession>({ did }));
      // act
      const actual = await sessionService.getSessionDid(request);
      // assert
      expect(actual).toBe(did);
    });
    test("OAuthセッションを復元できなければnullを返す", async () => {
      // arrange
      cookieSessionStorage.getDid.mockResolvedValue(did);
      oauthClient.restore.mockRejectedValue(
        new OAuthSessionInvalidError(new Error("revoked")),
      );
      // act
      const actual = await sessionService.getSessionDid(request);
      // assert
      expect(actual).toBeNull();
    });
    test("CookieにDIDがなければ復元せずnullを返す", async () => {
      // arrange
      cookieSessionStorage.getDid.mockResolvedValue(null);
      // act
      const actual = await sessionService.getSessionDid(request);
      // assert
      expect(oauthClient.restore).not.toHaveBeenCalled();
      expect(actual).toBeNull();
    });
  });
  describe("destroySession", () => {
    beforeEach(() => {
      vi.resetAllMocks();
      cookieSessionStorage.destroy.mockResolvedValue("destroyed");
    });
    test("OAuthセッションを失効させてCookieを破棄する", async () => {
      // arrange
      cookieSessionStorage.getDid.mockResolvedValue(did);
      oauthClient.revoke.mockResolvedValue();
      // act
      const actual = await sessionService.destroySession(request);
      // assert
      expect(oauthClient.revoke).toHaveBeenCalledWith(did);
      expect(actual).toBe("destroyed");
    });
    test("ログインしていなければ失効させずにCookieを破棄する", async () => {
      // arrange
      cookieSessionStorage.getDid.mockResolvedValue(null);
      // act
      const actual = await sessionService.destroySession(request);
      // assert
      expect(oauthClient.revoke).not.toHaveBeenCalled();
      expect(actual).toBe("destroyed");
    });
    test("失効に失敗してもCookieを破棄する", async () => {
      // arrange
      cookieSessionStorage.getDid.mockResolvedValue(did);
      oauthClient.revoke.mockRejectedValue(new Error("failed"));
      // act
      const actual = await sessionService.destroySession(request);
      // assert
      expect(childLogger.error).toHaveBeenCalled();
      expect(actual).toBe("destroyed");
    });
  });
});
