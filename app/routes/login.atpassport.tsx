import { redirect } from "react-router";

import { atpassportService } from "~/server/service/atpassportService";

import type { Route } from "./+types/login.atpassport";

export async function loader(_: Route.LoaderArgs) {
  const { url, setCookie } = await atpassportService.startLogin();
  return redirect(url, {
    headers: { "Set-Cookie": setCookie },
  });
}
