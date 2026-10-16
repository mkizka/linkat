import { redirect } from "react-router";
import { setToast } from "remix-toast/middleware";

import { getInstance } from "~/i18n/i18n";
import { di } from "~/server/di";
import { ExportAuthorizationDeniedError } from "~/server/service/auth/auth";

import type { Route } from "./+types/oauth.callback";

export async function loader({ request, context }: Route.LoaderArgs) {
  const logger = di.logger.child("oauth.callback");
  try {
    const { did, toExport } = await di.authService.handleCallback(request.url);
    logger.info("ログインに成功しました", { did });
    return redirect(toExport ? "/export" : "/", {
      headers: {
        "Set-Cookie": await di.sessionService.createSession(request, did),
      },
    });
  } catch (error) {
    if (error instanceof ExportAuthorizationDeniedError) {
      logger.info("書き出しの許可が拒否されました");
      setToast(context, {
        message: getInstance(context).t("export.reauth-denied-message"),
        type: "error",
      });
      return redirect("/");
    }
    logger.error("OAuthコールバックに失敗しました", { error });
    return redirect("/login");
  }
}
