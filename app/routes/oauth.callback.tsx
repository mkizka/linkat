import { redirect } from "react-router";

import { di } from "~/server/di";

import type { Route } from "./+types/oauth.callback";

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const did = await di.authService.handleCallback(request.url);
    return redirect("/edit", {
      headers: {
        "Set-Cookie": await di.sessionService.createSession(request, did),
      },
    });
  } catch (error) {
    di.logger.error("OAuthコールバックに失敗しました", { error });
    return redirect("/login");
  }
}
