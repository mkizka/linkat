import { EyeIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { UserIcon } from "@heroicons/react/24/solid";
import type { User } from "@prisma/client";
import { Link } from "@remix-run/react";

import { Card } from "~/components/card";

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
  const rightMenu = {
    edit: (
      <Link className="btn btn-accent" to={`/edit?base=${user.handle}`}>
        <PencilSquareIcon className="size-6" />
        編集
      </Link>
    ),
    preview: (
      <Link
        className="btn btn-accent animate-bounce repeat-0"
        to={`/board/${user.handle}`}
      >
        <EyeIcon className="size-6" />
        プレビュー
      </Link>
    ),
    link: (
      // TODO: 整える
      <a className="btn btn-link" href={`https://bsky.app/profile/${user.did}`}>
        link
      </a>
    ),
    none: null,
  };

  return (
    <Card>
      <div className="card-body">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <Avatar avatar={user.avatar} />
          ) : (
            <AvatarPlaceholder />
          )}
          <div>
            <h1 className="text-xl font-bold">{user.displayName}</h1>
            <p className="text-lg">@{user.handle}</p>
          </div>
          <div className="flex flex-1 justify-end">{rightMenu[button]}</div>
        </div>
      </div>
    </Card>
  );
}
