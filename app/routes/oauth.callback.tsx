import { redirect } from "react-router";

import { oauthClient } from "~/server/oauth/client";
import { commitSession, getSession } from "~/server/oauth/session";
import { createLogger } from "~/utils/logger";

import type { Route } from "./+types/oauth.callback";

const logger = createLogger("oauth.callback");

export async function loader({ request }: Route.LoaderArgs) {
  const remixSession = await getSession(request);
  try {
    const { session: oauthSession } = await oauthClient.callback(
      new URL(request.url).searchParams,
    );
    remixSession.set("did", oauthSession.did);
    return redirect("/edit", {
      headers: {
        "Set-Cookie": await commitSession(remixSession),
      },
    });
  } catch (error) {
    logger.error(error, "OAuthコールバックに失敗しました");
    return redirect("/login");
  }
}
