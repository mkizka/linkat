import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";

import { destroySession, getSession } from "~/server/oauth/session";

export const action = async ({ request }: ActionFunctionArgs) => {
  const session = await getSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
};
