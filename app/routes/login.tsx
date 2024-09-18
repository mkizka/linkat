import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";

import { Button } from "~/components/button";
import { oauthClient } from "~/server/oauth/client";
import { createLogger } from "~/utils/logger";

const logger = createLogger("login");

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const handle = form.get("handle");
  if (typeof handle !== "string") {
    return redirect("/login");
  }
  try {
    const url = await oauthClient.authorize(handle, {
      scope: "atproto transition:generic",
    });
    return redirect(url.toString());
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return redirect("/login");
  }
}

export default function LoginPage() {
  return (
    <Form method="post">
      <input name="handle" type="text" data-testid="login-form__handle" />
      <Button data-testid="login-form__submit">送信</Button>
    </Form>
  );
}
