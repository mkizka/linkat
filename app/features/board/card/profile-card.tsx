import { EyeIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { UserIcon } from "@heroicons/react/24/solid";
import type { User } from "@prisma/client";
import { Link } from "@remix-run/react";

import { Card } from "~/components/card";
import { BlueskyIcon } from "~/features/board/icons/bluesky";

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
    <div className="avatar placeholder">
      <div className="w-14 rounded-full bg-neutral text-neutral-content">
        <UserIcon className="w-8" />
      </div>
    </div>
  );
}

export type ProfileCardProps = {
  user: Pick<User, "avatar" | "displayName" | "handle" | "did">;
  button: "edit" | "preview" | "link" | "none";
};

export function ProfileCard({ user, button }: ProfileCardProps) {
  const buttons = {
    edit: (
      <Link
        className="btn btn-primary"
        to={`/edit?base=${user.handle}`}
        data-testid="profile-card__edit"
      >
        <PencilSquareIcon className="size-6" />
        編集
      </Link>
    ),
    preview: (
      <Link
        className="btn btn-primary animate-bounce repeat-0"
        to={`/board/${user.handle}`}
        data-testid="profile-card__preview"
      >
        <EyeIcon className="size-6" />
        ページを見る
      </Link>
    ),
    link: (
      <Link
        className="btn bg-[#0285FF] text-base-100"
        to={`https://bsky.app/profile/${user.did}`}
      >
        <BlueskyIcon className="size-6" />@{user.handle}
      </Link>
    ),
    none: null,
  };

  return (
    <Card>
      <div className="card-body">
        <div className="flex items-center">
          {user.avatar ? (
            <Avatar avatar={user.avatar} />
          ) : (
            <AvatarPlaceholder />
          )}
          <div className="flex flex-1 justify-end">{buttons[button]}</div>
        </div>
        <div>
          <h2 className="text-xl font-bold">{user.displayName}</h2>
          <p className="text-gray-500">@{user.handle}</p>
        </div>
      </div>
    </Card>
  );
}
