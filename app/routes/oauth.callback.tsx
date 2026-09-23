import { redirect } from "react-router";

import { di } from "~/server/di";
import { createLogger } from "~/utils/logger";

import type { Route } from "./+types/oauth.callback";

const logger = createLogger("oauth.callback");

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const did = await di.authService.handleCallback(request.url);
    return redirect("/edit", {
      headers: {
        "Set-Cookie": await di.sessionService.createSession(request, did),
      },
    });
  } catch (error) {
    logger.error(error, "OAuthコールバックに失敗しました");
    return redirect("/login");
  }
}
