import { redirect } from "react-router";

import { oauthClient } from "~/server/oauth/client";
import { destroySession, getSession } from "~/server/oauth/session";
import { createLogger } from "~/utils/logger";

import type { Route } from "./+types/logout";

const logger = createLogger("logout");

export const action = async ({ request }: Route.ActionArgs) => {
  const session = await getSession(request);

  if (session.data.did) {
    try {
      await oauthClient.revoke(session.data.did);
    } catch (error) {
      logger.error(error, "OAuthセッションのrevokeに失敗しました");
    }
  }

  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
};
