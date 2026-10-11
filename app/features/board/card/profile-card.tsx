import { UserIcon } from "@heroicons/react/24/solid";
import type { ReactNode } from "react";

import { Card } from "~/components/card";
import type { User } from "~/models/user";

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

export type ProfileCardProps = {
  user: Pick<User, "avatar" | "displayName" | "handle">;
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
      </div>
    </Card>
  );
}
