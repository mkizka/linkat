import { PencilSquareIcon, ShareIcon } from "@heroicons/react/24/outline";
import { UserIcon } from "@heroicons/react/24/solid";
import type { User } from "@prisma/client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Button } from "~/components/button";
import { Card } from "~/components/card";
import { BlueskyIcon } from "~/components/icons/bluesky";

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
  user: Pick<User, "avatar" | "displayName" | "handle">;
  url: string;
  showEditButton?: boolean;
};

export function ProfileCard({ user, url, showEditButton }: ProfileCardProps) {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const shareText = t("profile-card.share-text", {
    url,
    displayName: user.displayName,
  });

  const handlePost = async () => {
    setLoading(true);
    await fetch(`${url}/og`);
    open(
      `https://bsky.app/intent/compose?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noreferrer",
    );
    setLoading(false);

    void umami.track("click-share-link");
  };

  return (
    <Card>
      <div className="card-body gap-2">
        <div className="flex items-center">
          {user.avatar ? (
            <Avatar avatar={user.avatar} />
          ) : (
            <AvatarPlaceholder />
          )}
          <div className="flex flex-1 justify-end gap-2">
            {showEditButton ? (
              <Link
                className="btn btn-primary"
                to="/edit"
                data-testid="profile-card__edit"
              >
                <PencilSquareIcon className="size-6" />
                {t("profile-card.edit-button")}
              </Link>
            ) : (
              <a
                className="btn-bluesky btn text-base-100"
                href={`https://bsky.app/profile/${user.handle}`}
                target="_blank"
                rel="noreferrer"
                data-umami-event="click-bsky-link"
                data-umami-event-handle={user.handle}
              >
                <BlueskyIcon className="size-6" />
                Bluesky
              </a>
            )}
            <Button
              className="btn btn-square btn-neutral"
              loading={loading}
              onClick={handlePost}
            >
              <ShareIcon className="size-6" />
            </Button>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold">{user.displayName}</h2>
          <p className="text-gray-500">@{user.handle}</p>
        </div>
      </div>
    </Card>
  );
}
