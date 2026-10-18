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
      className={cn("btn relative", className)}
      disabled={loading}
      {...buttonProps}
    >
      {loading && <div className="loading loading-spinner absolute h-1/2" />}
      <span className={cn("contents", loading && "invisible")}>{children}</span>
    </button>
  );
}
