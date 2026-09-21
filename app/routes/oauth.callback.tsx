import { redirect } from "react-router";

import { authService } from "~/server/service/authService";
import { sessionService } from "~/server/service/sessionService";
import { createLogger } from "~/utils/logger";

import type { Route } from "./+types/oauth.callback";

const logger = createLogger("oauth.callback");

export async function loader({ request }: Route.LoaderArgs) {
  const remixSession = await sessionService.getSession(request);
  try {
    const did = await authService.handleCallback(
      new URL(request.url).searchParams,
    );
    remixSession.set("did", did);
    return redirect("/edit", {
      headers: {
        "Set-Cookie": await sessionService.commitSession(remixSession),
      },
    });
  } catch (error) {
    logger.error(error, "OAuthコールバックに失敗しました");
    return redirect("/login");
  }
}
