import { oauthClient } from "~/server/oauth/client";

export function loader() {
  return Response.json(oauthClient.jwks);
}
