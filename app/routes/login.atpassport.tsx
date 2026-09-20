import { redirect } from "react-router";

import { authService } from "~/server/service/authService";

import type { Route } from "./+types/login.atpassport";

export async function loader(_: Route.LoaderArgs) {
  const { url, atpstate } = authService.generateAtpassportAuthUrl();
  return redirect(url, {
    headers: {
      "Set-Cookie": await authService.atpstateCookie.serialize(atpstate),
    },
  });
}
