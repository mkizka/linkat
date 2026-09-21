import { atpassportClient } from "~/server/infrastructure/atpassportClient";
import { atpstateCookie } from "~/server/infrastructure/cookie";

export { atpstateCookie };

export const generateAuthUrl = () => atpassportClient.generateAuthUrl();

export const parseCallback = (url: string, atpstate: string) =>
  atpassportClient.parseCallback(url, atpstate);
