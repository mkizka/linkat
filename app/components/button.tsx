import type { ComponentProps } from "react";

import { cn } from "~/utils/cn";

type Props = ComponentProps<"button"> & {
  loading?: boolean;
};

export function Button({
  children,
  className,
  loading,
  ...buttonProps
}: Props) {
  return (
    <button
      className={cn("btn btn-primary relative", className)}
      disabled={loading}
      {...buttonProps}
    >
      {loading && <div className="loading loading-spinner absolute h-1/2" />}
      {loading && <span className="opacity-0">{children}</span>}
      {!loading && children}
    </button>
  );
}
