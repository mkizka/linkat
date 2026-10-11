import { UserIcon } from "@heroicons/react/24/solid";
import type { ReactNode } from "react";

import { Card } from "~/components/card";
import type { OwnerView } from "~/server/service/owner/ownerView";

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

type ProfileCardProps = {
  owner: OwnerView;
  actions?: ReactNode;
};

export function ProfileCard({ owner, actions }: ProfileCardProps) {
  return (
    <Card>
      <div className="card-body gap-2">
        <div className="flex items-center">
          {owner.avatarUrl ? (
            <Avatar avatar={owner.avatarUrl} />
          ) : (
            <AvatarPlaceholder />
          )}
          <div className="flex flex-1 justify-end gap-2">{actions}</div>
        </div>
        <div>
          <h2 className="text-xl font-bold">{owner.displayName}</h2>
          <p className="text-gray-500">{owner.displayHandle}</p>
        </div>
      </div>
    </Card>
  );
}
