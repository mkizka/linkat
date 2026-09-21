import { redirect } from "react-router";

import { oauthClient, scope } from "~/server/infrastructure/oauthClient";
import { atpassport, atpstateCookie } from "~/server/oauth/atpassport";
import { createLogger } from "~/utils/logger";

import type { Route } from "./+types/login.atpassport.callback";

const logger = createLogger("login.atpassport.callback");

export async function loader({ request }: Route.LoaderArgs) {
  const savedAtpstate: unknown = await atpstateCookie.parse(
    request.headers.get("Cookie"),
  );
  if (typeof savedAtpstate !== "string") {
    logger.warn(
      "atpstate Cookieが見つからないため、コールバックを拒否しました",
    );
    return redirect("/login");
  }

  let handle;
  try {
    const result = atpassport.parseCallback(request.url, savedAtpstate);
    handle = result.username;
  } catch (error) {
    logger.error(error, "ATPassportのコールバック検証に失敗しました");
    return redirect("/login");
  }
  if (!handle) {
    return redirect("/login");
  }

  try {
    const authorizeUrl = await oauthClient.authorize(handle, { scope });
    return redirect(authorizeUrl.toString());
  } catch (error) {
    logger.error(error, "ATPassport経由のOAuthログインに失敗しました");
    return redirect("/login");
  }
}
