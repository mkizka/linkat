import { redirect } from "react-router";

import { di } from "~/server/di";

import type { Route } from "./+types/logout";

export const action = async ({ request }: Route.ActionArgs) => {
  return redirect("/", {
    headers: {
      "Set-Cookie": await di.sessionService.destroySession(request),
    },
  });
};
