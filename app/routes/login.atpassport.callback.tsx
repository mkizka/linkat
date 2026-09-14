import { redirect } from "react-router";

import { atpassport, atpstateCookie } from "~/server/oauth/atpassport";
import { oauthClient, scope } from "~/server/oauth/client";
import { createLogger } from "~/utils/logger";

import type { Route } from "./+types/login.atpassport.callback";

const logger = createLogger("login.atpassport.callback");

export async function loader({ request }: Route.LoaderArgs) {
  const savedAtpstate: unknown = await atpstateCookie.parse(
    request.headers.get("Cookie"),
  );

  let handle;
  try {
    const result = atpassport.parseCallback(
      request.url,
      typeof savedAtpstate === "string" ? savedAtpstate : null,
    );
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
