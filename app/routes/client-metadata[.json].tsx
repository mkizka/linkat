import { createOAuthClient } from "~/server/oauth/client";

export async function loader() {
  const oauthClient = await createOAuthClient();
  return Response.json(oauthClient.clientMetadata);
}
