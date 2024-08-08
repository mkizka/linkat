/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ClientLoaderFunction } from "@remix-run/react";
import { createStore } from "jotai";

import { useLogin } from "~/atoms/userAtom/hooks";
import { resumeSessionAtom } from "~/atoms/userAtom/write-only";

export const clientLoader: ClientLoaderFunction = async () => {
  const store = createStore();
  await store.set(resumeSessionAtom);
  return null;
};

export { HydrateFallback } from "~/components/hydate-fallback";

export default function Index() {
  const login = useLogin();

  return (
    <button
      className="btn btn-primary"
      onClick={() =>
        login({
          service: import.meta.env.VITE_BSKY_URL,
          identifier: import.meta.env.VITE_BSKY_USERNAME,
          password: import.meta.env.VITE_BSKY_PASSWORD,
        })
      }
    >
      Login
    </button>
  );
}
