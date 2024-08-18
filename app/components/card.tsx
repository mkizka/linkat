import type { ComponentProps, ReactNode } from "react";
import { forwardRef } from "react";

import { cn } from "~/utils/cn";

type Props = ComponentProps<"div"> & {
  className?: string;
  children?: ReactNode;
};

export const Card = forwardRef<HTMLDivElement, Props>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn("card bg-base-100 shadow-xl", className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";
