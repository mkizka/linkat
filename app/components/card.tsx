import { LinkIcon } from "@heroicons/react/24/solid";
import { forwardRef } from "react";

import { cn } from "~/utils/cn";

type Props = {
  className?: string;
};

export const Card = forwardRef<HTMLDivElement, Props>(({ className }, ref) => {
  return (
    <div className={cn("card bg-base-100 shadow-xl", className)} ref={ref}>
      <div className="card-body flex-row items-center gap-4">
        <LinkIcon className="size-8" />
        <p className="flex-1 truncate">
          テキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキスト
        </p>
      </div>
    </div>
  );
});

Card.displayName = "Card";
