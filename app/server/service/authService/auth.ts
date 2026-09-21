import { oauthClient } from "~/server/infrastructure/oauthClient";

export const authorize = (handle: string) => oauthClient.authorize(handle);

export const handleCallback = (url: string) => {
  const params = new URL(url).searchParams;
  return oauthClient.callback(params);
};

export const getClientMetadata = () => oauthClient.clientMetadata;

export const getJwks = () => oauthClient.jwks;
