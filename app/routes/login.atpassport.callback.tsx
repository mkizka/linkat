import { redirect } from "react-router";

import { di } from "~/server/di";

import type { Route } from "./+types/login.atpassport.callback";

export async function loader({ request }: Route.LoaderArgs) {
  const logger = di.logger.child("login.atpassport.callback");
  let handle;
  try {
    handle = await di.atpassportService.verifyCallback(request);
  } catch (error) {
    logger.error("ATPassportのコールバック検証に失敗しました", { error });
    return redirect("/login");
  }
  try {
    const authorizeUrl = await di.authService.authorize(handle);
    return redirect(authorizeUrl.toString());
  } catch (error) {
    logger.error("ATPassport経由のOAuthログインに失敗しました", { error });
    return redirect("/login");
  }
}
