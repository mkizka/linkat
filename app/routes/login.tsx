import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { useEffect } from "react";

import { useToast } from "~/atoms/toast/hooks";
import { LoginForm } from "~/features/login/login-form";
import { oauthClient } from "~/server/oauth/client";

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const handle = form.get("identifier");
  if (typeof handle !== "string") {
    return { error: "不明なエラーが発生しました" };
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
  const actionData = useActionData<typeof action>();
  const toast = useToast();

  useEffect(() => {
    if (actionData) {
      toast.error(actionData.error);
    }
  }, [actionData, toast]);

  return (
    <div className="utils--center">
      <LoginForm />
    </div>
  );
}