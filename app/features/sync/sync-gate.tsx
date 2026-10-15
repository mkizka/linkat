import type { ReactNode } from "react";

import { Main } from "~/components/layout";

import { SyncError } from "./sync-error";
import { SyncLoading } from "./sync-loading";
import type { SyncState } from "./use-sync";

type Props = {
  state: SyncState;
  onRetry: () => void;
  children: ReactNode;
};

export function SyncGate({ state, onRetry, children }: Props) {
  if (state === "ready") {
    return children;
  }
  return (
    <Main className="utils--center">
      {state === "loading" ? <SyncLoading /> : <SyncError onRetry={onRetry} />}
    </Main>
  );
}
