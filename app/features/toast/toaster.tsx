import { useToasts } from "~/atoms/toast/hooks";
import { cn } from "~/utils/cn";

export function Toaster() {
  const toasts = useToasts();
  return (
    <div className="toast">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn("alert", {
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
