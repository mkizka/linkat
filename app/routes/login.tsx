import { OAuthResolverError } from "@atproto/oauth-client-node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { LoginForm } from "~/features/login/login-form";
import { RouteToaster } from "~/features/toast/route";
import { oauthClient } from "~/server/oauth/client";
import { createLogger } from "~/utils/logger";

const logger = createLogger("login");

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const handle = form.get("identifier");
  if (typeof handle !== "string") {
    return { error: "不明なエラーが発生しました" };
  }
  try {
    const url = await oauthClient.authorize(handle, {
      scope: "atproto transition:generic",
    });
    return redirect(url.toString());
  } catch (error) {
    logger.info("OAuthログインに失敗しました", { error: String(error) });
    if (error instanceof OAuthResolverError) {
      return { error: "ログインに失敗しました(ハンドルを間違えてるかも)" };
    }
    return { error: "ログインに失敗しました" };
  }
}

export default function LoginPage() {
  return (
    <div className="utils--center">
      <LoginForm />
      <RouteToaster />
    </div>
  );
}
