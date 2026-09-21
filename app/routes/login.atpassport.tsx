import { redirect } from "react-router";

import {
  atpassport,
  atpstateCookie,
} from "~/server/infrastructure/atpassportClient";

import type { Route } from "./+types/login.atpassport";

export async function loader(_: Route.LoaderArgs) {
  const { url, atpstate } = atpassport.generateAuthUrl();
  return redirect(url, {
    headers: {
      "Set-Cookie": await atpstateCookie.serialize(atpstate),
    },
  });
}
