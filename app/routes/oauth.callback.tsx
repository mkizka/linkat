import { redirect } from "react-router";

import { oauthClient } from "~/server/oauth/client";
import { sessionService } from "~/server/service/sessionService";
import { createLogger } from "~/utils/logger";

import type { Route } from "./+types/oauth.callback";

const logger = createLogger("oauth.callback");

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const { session: oauthSession } = await oauthClient.callback(
      new URL(request.url).searchParams,
    );
    return redirect("/edit", {
      headers: {
        "Set-Cookie": await sessionService.createSession(
          request,
          oauthSession.did,
        ),
      },
    });
  } catch (error) {
    logger.error(error, "OAuthコールバックに失敗しました");
    return redirect("/login");
  }
}
