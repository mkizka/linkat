import type { IAtpassportClient } from "~/server/infrastructure/atpassportClient";

export interface IAtpassportService {
  startLogin: () => Promise<{ url: string; setCookie: string }>;
  verifyCallback: (request: Request) => Promise<string>;
}

export const atpassportServiceFactory = ({
  atpassportClient,
}: {
  atpassportClient: IAtpassportClient;
}): IAtpassportService => ({
  startLogin: () => atpassportClient.startLogin(),
  verifyCallback: (request) =>
    atpassportClient.verifyCallback(request.url, request.headers.get("Cookie")),
});
