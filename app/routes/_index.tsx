import { type ClientLoaderFunction, redirect } from "@remix-run/react";
import { createStore } from "jotai";

import { userAtom } from "~/atoms/user/base";
import { resumeSessionAtom } from "~/atoms/user/write-only";
import { LoginForm } from "~/components/login-form";

export const clientLoader: ClientLoaderFunction = async () => {
  const store = createStore();
  await store.set(resumeSessionAtom);
  const user = store.get(userAtom);
  if (user) {
    return redirect("/edit");
  }
  return null;
};

export { HydrateFallback } from "~/components/hydate-fallback";

export default function Index() {
  return (
    <div className="grid h-screen place-items-center">
      <LoginForm />
    </div>
  );
}
