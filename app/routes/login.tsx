import { OAuthResolverError } from "@atproto/oauth-client-node";
import { redirect } from "react-router";

import { Main, RootLayout } from "~/components/layout";
import { LoginForm } from "~/features/login/login-form";
import { RouteToaster } from "~/features/toast/route";
import { i18nServer } from "~/i18n/i18n";
import { oauthClient } from "~/server/oauth/client";
import { getSessionUserDid } from "~/server/oauth/session";
import { createLogger } from "~/utils/logger";

import type { Route } from "./+types/login";

const logger = createLogger("login");

export async function action({ request }: Route.ActionArgs) {
  const t = await i18nServer.getFixedT(request);
  const form = await request.formData();
  const handle = form.get("identifier");
  if (typeof handle !== "string") {
    return { error: t("login.unknown-error") };
  }
  try {
    const url = await oauthClient.authorize(handle, {
      scope: "atproto include:blue.linkat.basicPermissions",
    });
    return redirect(url.toString());
  } catch (error) {
    logger.error(error, "OAuthログインに失敗しました");
    if (error instanceof OAuthResolverError) {
      return { error: t("login.oauth-resolve-error-message") };
    }
    return { error: t("login.default-error-message") };
  }
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const userDid = await getSessionUserDid(request);
  if (userDid) {
    return redirect("/");
  }
  return null;
};

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
