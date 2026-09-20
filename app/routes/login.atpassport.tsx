import { redirect } from "react-router";

import { atpassportService } from "~/server/service/atpassportService";

import type { Route } from "./+types/login.atpassport";

export async function loader(_: Route.LoaderArgs) {
  const { url, atpstate } = atpassportService.generateAuthUrl();
  return redirect(url, {
    headers: {
      "Set-Cookie": await atpassportService.atpstateCookie.serialize(atpstate),
    },
  });
}
