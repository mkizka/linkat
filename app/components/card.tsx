import { LinkIcon } from "@heroicons/react/24/solid";

export function Card() {
  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body flex-row items-center">
        <LinkIcon className="size-8" />
        <p className="flex-1 truncate">
          テキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキスト
        </p>
      </div>
    </div>
  );
}
