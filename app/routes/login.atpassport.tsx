import { redirect } from "react-router";

import { di } from "~/server/di";

import type { Route } from "./+types/login.atpassport";

export async function loader(_: Route.LoaderArgs) {
  const { url, setCookie } = await di.atpassportService.startLogin();
  return redirect(url, {
    headers: { "Set-Cookie": setCookie },
  });
}
