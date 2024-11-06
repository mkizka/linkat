import { json } from "@remix-run/node";

import { createOAuthClient } from "~/server/oauth/client";

export async function loader() {
  const oauthClient = await createOAuthClient();
  return json(oauthClient.jwks);
}
