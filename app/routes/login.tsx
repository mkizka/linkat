import { OAuthResolverError } from "@atproto/oauth-client-node";
import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";

import { Main, RootLayout } from "~/components/layout";
import { LoginForm } from "~/features/login/login-form";
import { RouteToaster } from "~/features/toast/route";
import { i18nServer } from "~/i18n/i18n";
import { createOAuthClient } from "~/server/oauth/client";
import { createLogger } from "~/utils/logger";

const logger = createLogger("login");

export async function action({ request }: ActionFunctionArgs) {
  const t = await i18nServer.getFixedT(request);
  const form = await request.formData();
  const handle = form.get("identifier");
  if (typeof handle !== "string") {
    return { error: t("login.unknown-error") };
  }
  try {
    const oauthClient = await createOAuthClient();
    const url = await oauthClient.authorize(handle, {
      scope: "atproto transition:generic",
    });
    return redirect(url.toString());
  } catch (error) {
    logger.info("OAuthログインに失敗しました", { error: String(error) });
    if (error instanceof OAuthResolverError) {
      return { error: t("login.oauth-resolve-error-message") };
    }
    return { error: t("login.default-error-message") };
  }
}

export default function LoginPage() {
  return (
    <RootLayout>
      <Main className="utils--center">
        <LoginForm />
        <RouteToaster />
      </Main>
    </RootLayout>
  );
}
