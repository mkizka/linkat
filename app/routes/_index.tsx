import type { ClientLoaderFunction } from "@remix-run/react";
import { createStore } from "jotai";

import { resumeSessionAtom } from "~/atoms/user/write-only";
import { LoginForm } from "~/components/login-form";

export const clientLoader: ClientLoaderFunction = async () => {
  const store = createStore();
  await store.set(resumeSessionAtom);
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
