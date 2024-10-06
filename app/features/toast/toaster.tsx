import { useToasts } from "~/atoms/toast/hooks";
import { cn } from "~/utils/cn";

export function Toaster() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;
  return (
    <div className="toast toast-center w-full max-w-screen-sm whitespace-normal opacity-90">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn("alert text-start", {
            "alert-success": toast.level === "success",
            "alert-error": toast.level === "error",
            "animate-out fade-out-10": toast.removing,
          })}
        >
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
