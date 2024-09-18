import { useAtomValue, useSetAtom } from "jotai";
import { useMemo } from "react";

import { toastsAtom } from "./base";
import { pushToastAtom } from "./write-only";

export const useToasts = () => useAtomValue(toastsAtom);

export const useToast = () => {
  const toast = useSetAtom(pushToastAtom);
  return useMemo(
    () => ({
      success: (message: string) => toast(message, "success"),
      error: (message: string) => toast(message, "error"),
    }),
    [toast],
  );
};
