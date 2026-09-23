import { redirect } from "react-router";

import { di } from "~/server/di";
import { createLogger } from "~/utils/logger";

import type { Route } from "./+types/login.atpassport.callback";

const logger = createLogger("login.atpassport.callback");

export async function loader({ request }: Route.LoaderArgs) {
  let handle;
  try {
    handle = await di.atpassportService.verifyCallback(request);
  } catch (error) {
    logger.error(error, "ATPassportのコールバック検証に失敗しました");
    return redirect("/login");
  }
  try {
    const authorizeUrl = await di.authService.authorize(handle);
    return redirect(authorizeUrl.toString());
  } catch (error) {
    logger.error(error, "ATPassport経由のOAuthログインに失敗しました");
    return redirect("/login");
  }
}
