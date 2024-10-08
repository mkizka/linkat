import { type LoaderFunctionArgs, redirect } from "@remix-run/node";

import { createOAuthClient } from "~/server/oauth/client";
import { commitSession, getSession } from "~/server/oauth/session";
import { createLogger } from "~/utils/logger";

const logger = createLogger("oauth.callback");

export async function loader({ request }: LoaderFunctionArgs) {
  const remixSession = await getSession(request);
  try {
    const oauthClient = await createOAuthClient();
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
    logger.error("OAuthコールバックに失敗しました", { error: String(error) });
    return redirect("/login");
  }
}
