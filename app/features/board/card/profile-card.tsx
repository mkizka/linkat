import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { UserIcon } from "@heroicons/react/24/solid";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";

import { Card } from "~/components/card";
import type { User } from "~/models/user";
import { cn } from "~/utils/cn";

function Avatar({ avatar }: { avatar: string }) {
  return (
    <div className="avatar">
      <div className="w-14 rounded-full">
        <img src={avatar} />
      </div>
    </div>
  );
}

function AvatarPlaceholder() {
  return (
    <div className="avatar avatar-placeholder">
      <div className="w-14 rounded-full bg-neutral text-neutral-content">
        <UserIcon className="w-8" />
      </div>
    </div>
  );
}

function Description({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [clamped, setClamped] = useState(false);

  useLayoutEffect(() => {
    if (ref.current) {
      setClamped(ref.current.scrollHeight > ref.current.clientHeight);
    }
  }, [text]);

  const Icon = open ? ChevronUpIcon : ChevronDownIcon;
  return (
    <button
      type="button"
      className="flex items-start gap-1 border-t border-base-300 pt-2 text-left text-sm"
      onClick={() => setOpen((open) => !open)}
      disabled={!clamped && !open}
      data-testid="profile-card__description"
    >
      <p
        ref={ref}
        className={cn("flex-1 whitespace-pre-wrap", !open && "line-clamp-2")}
      >
        {text}
      </p>
      {(clamped || open) && <Icon className="mt-0.5 size-4 shrink-0" />}
    </button>
  );
}

export type ProfileCardProps = {
  user: Pick<User, "avatar" | "description" | "displayName" | "handle">;
  actions?: ReactNode;
};

export function ProfileCard({ user, actions }: ProfileCardProps) {
  return (
    <Card>
      <div className="card-body gap-2">
        <div className="flex items-center">
          {user.avatar ? (
            <Avatar avatar={user.avatar} />
          ) : (
            <AvatarPlaceholder />
          )}
          <div className="flex flex-1 justify-end gap-2">{actions}</div>
        </div>
        <div>
          <h2 className="text-xl font-bold">{user.displayName}</h2>
          <p className="text-gray-500">@{user.handle}</p>
        </div>
        {user.description && <Description text={user.description} />}
      </div>
    </Card>
  );
}
