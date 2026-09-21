import { redirect } from "react-router";

import { sessionService } from "~/server/service/sessionService";

import type { Route } from "./+types/logout";

export const action = async ({ request }: Route.ActionArgs) => {
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionService.destroySession(request),
    },
  });
};
