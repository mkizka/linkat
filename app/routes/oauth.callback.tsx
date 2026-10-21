import { redirect } from "react-router";
import { setToast } from "remix-toast/middleware";

import { getInstance } from "~/i18n/i18n";
import { di } from "~/server/di";
import { AuthCallbackError } from "~/server/service/auth/auth";

import type { Route } from "./+types/oauth.callback";

export async function loader({ request, context }: Route.LoaderArgs) {
  const logger = di.logger.child("oauth.callback");
  try {
    const { did, redirectTo } = await di.authService.handleCallback(
      request.url,
    );
    logger.info("ログインに成功しました", { did });
    return redirect(redirectTo, {
      headers: {
        "Set-Cookie": await di.sessionService.createSession(request, did),
      },
    });
  } catch (error) {
    const i18next = getInstance(context);
    if (error instanceof AuthCallbackError && error.denied) {
      logger.info("OAuthの許可が拒否されました");
      setToast(context, {
        message: i18next.t("login.access-denied-message"),
        type: "error",
      });
      return redirect(error.returnTo);
    }
    logger.error("OAuthコールバックに失敗しました", { error });
    setToast(context, {
      message: i18next.t("login.default-error-message"),
      type: "error",
    });
    return redirect(error instanceof AuthCallbackError ? error.returnTo : "/");
  }
}
