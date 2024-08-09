import type { ReactNode } from "react";
import { forwardRef } from "react";

import { cn } from "~/utils/cn";

type Props = {
  className?: string;
  children?: ReactNode;
};

export const Card = forwardRef<HTMLDivElement, Props>(
  ({ className, children }, ref) => {
    return (
      <div className={cn("card bg-base-100 shadow-xl", className)} ref={ref}>
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";
