import { useEffect, useState } from "react";
import type { getToast } from "remix-toast/middleware";

import { cn } from "~/utils/cn";

type Props = {
  toast: ReturnType<typeof getToast>;
};

const DISPLAY_DURATION = 5000;

export function Toaster({ toast }: Props) {
  const [hiddenToast, setHiddenToast] = useState<Props["toast"]>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(
      () => setHiddenToast(toast),
      toast.duration ?? DISPLAY_DURATION,
    );
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;
  const hidden = hiddenToast === toast;
  return (
    <div
      data-testid="toaster"
      className={cn(
        "toast toast-end toast-bottom w-full max-w-sm whitespace-normal opacity-90 transition-opacity duration-300",
        hidden && "pointer-events-none opacity-0",
      )}
    >
      <div
        className={cn("alert text-start", {
          "alert-success": toast.type === "success",
          "alert-error": toast.type === "error",
          "alert-info": toast.type === "info",
          "alert-warning": toast.type === "warning",
        })}
      >
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
