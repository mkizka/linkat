import { atpassportClient } from "~/server/infrastructure/atpassportClient";

export const startLogin = () => atpassportClient.startLogin();

export const verifyCallback = (request: Request) =>
  atpassportClient.verifyCallback(request.url, request.headers.get("Cookie"));
