import { redirect } from "react-router";

import { authService } from "~/server/service/authService";

import type { Route } from "./+types/logout";

export const action = async ({ request }: Route.ActionArgs) => {
  const session = await authService.getSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await authService.destroySession(session),
    },
  });
};
