import { OAuthResolverError } from "@atproto/oauth-client-node";
import { redirect } from "react-router";
import { setToast } from "remix-toast/middleware";

import { Main, RootLayout } from "~/components/layout";
import { LoginForm } from "~/features/login/login-form";
import { getInstance } from "~/i18n/i18n";
import { di } from "~/server/di";
import { createLogger } from "~/utils/logger";

import type { Route } from "./+types/login";

const logger = createLogger("login");

export async function action({ request, context }: Route.ActionArgs) {
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
    return redirect(url.toString());
  } catch (error) {
    logger.error(error, "OAuthログインに失敗しました");
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
  const userDid = await di.sessionService.getSessionUserDid(request);
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
      </Main>
    </RootLayout>
  );
}
