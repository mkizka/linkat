import { OAuthResolverError } from "@atproto/oauth-client-node";
import { redirect } from "react-router";
import { setToast } from "remix-toast/middleware";

import { getInstance } from "~/i18n/i18n";
import { LoginPage } from "~/pages/login-page";
import { di } from "~/server/di";

import type { Route } from "./+types/login";

export async function action({ request, context }: Route.ActionArgs) {
  const logger = di.logger.child("login");
  const i18next = getInstance(context);
  const form = await request.formData();
  const handle = form.get("handle");
  if (typeof handle !== "string") {
    setToast(context, {
      message: i18next.t("login.unknown-error-message"),
      type: "error",
    });
    return null;
  }
  try {
    const url = await di.authService.authorize(handle);
    logger.info("ログインを開始しました", { method: "handle" });
    return redirect(url.toString());
  } catch (error) {
    logger.error("OAuthログインに失敗しました", { error });
    if (error instanceof OAuthResolverError) {
      setToast(context, {
        message: i18next.t("login.oauth-resolve-error-message"),
        type: "error",
      });
      return null;
    }
    setToast(context, {
      message: i18next.t("login.default-error-message"),
      type: "error",
    });
    return null;
  }
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const editorDid = await di.sessionService.getSessionDid(request);
  if (editorDid) {
    return redirect("/");
  }
  return null;
};

export default LoginPage;
