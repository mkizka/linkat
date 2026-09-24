import type { getToast } from "remix-toast/middleware";

import { cn } from "~/utils/cn";

export function Toaster({ toast }: { toast: ReturnType<typeof getToast> }) {
  if (!toast) return null;
  return (
    <div
      data-testid="toaster"
      // 一定時間表示した後CSSだけでフェードアウトさせる
      className="pointer-events-none toast toast-center w-full max-w-screen-sm animate-out whitespace-normal opacity-90 fade-out-0 fill-mode-forwards [animation-delay:5s]"
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
