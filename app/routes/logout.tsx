import { redirect } from "react-router";

import { destroySession } from "~/server/oauth/session";

import type { Route } from "./+types/logout";

export const action = async ({ request }: Route.ActionArgs) => {
  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(request),
    },
  });
};
