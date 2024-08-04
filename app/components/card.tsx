import { LinkIcon } from "@heroicons/react/24/solid";

import { cn } from "~/utils/cn";

type Props = {
  className?: string;
};

export function Card({ className }: Props) {
  return (
    <div className={cn("card bg-base-100 shadow-xl", className)}>
      <div className="card-body flex-row items-center gap-4">
        <LinkIcon className="size-8" />
        <p className="flex-1 truncate">
          テキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキスト
        </p>
      </div>
    </div>
  );
}
