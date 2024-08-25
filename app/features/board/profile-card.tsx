import { UserIcon } from "@heroicons/react/24/solid";
import type { User } from "@prisma/client";

import { Card } from "~/components/card";

function Avatar({ avatar }: { avatar: string }) {
  return (
    <div className="avatar">
      <div className="w-20 rounded-full">
        <img src={avatar} />
      </div>
    </div>
  );
}

function AvatarPlaceholder() {
  return (
    <div className="avatar placeholder">
      <div className="w-20 rounded-full bg-neutral text-neutral-content">
        <UserIcon className="w-12" />
      </div>
    </div>
  );
}

export type ProfileCardProps = {
  user: Pick<User, "avatar" | "displayName" | "handle" | "description">;
};

export function ProfileCard({ user }: ProfileCardProps) {
  return (
    <Card>
      <div className="card-body">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <Avatar avatar={user.avatar} />
          ) : (
            <AvatarPlaceholder />
          )}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">{user.displayName}</h1>
            <p className="text-xl">@{user.handle}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
