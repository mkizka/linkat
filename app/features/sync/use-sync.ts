import { useEffect } from "react";
import { useFetcher } from "react-router";

import type { action as syncAction } from "~/routes/sync";

export type SyncState = "ready" | "loading" | "error";

export function useSync(needsSync: boolean) {
  const sync = useFetcher<typeof syncAction>();
  const submit = () => sync.submit(null, { method: "post", action: "/sync" });

  useEffect(() => {
    if (needsSync && sync.state === "idle" && !sync.data) {
      void submit();
    }
  });

  const state: SyncState =
    !needsSync || (sync.state === "idle" && sync.data?.ok)
      ? "ready"
      : sync.state !== "idle" || !sync.data
        ? "loading"
        : "error";

  return { state, retry: () => void submit() };
}
