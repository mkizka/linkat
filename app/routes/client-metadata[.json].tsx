import { oauthClient } from "~/server/infrastructure/oauthClient";

export function loader() {
  return Response.json(oauthClient.clientMetadata);
}
