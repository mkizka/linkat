import { PencilSquareIcon, ShareIcon } from "@heroicons/react/24/outline";
import { UserIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Button } from "~/components/button";
import { Card } from "~/components/card";
import { BlueskyIcon } from "~/components/icons/bluesky";
import { useUmami } from "~/hooks/useUmami";
import type { OwnerView } from "~/models/owner";

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
  owner: OwnerView;
  url: string;
  showEditButton?: boolean;
};

export function ProfileCard({ owner, url, showEditButton }: ProfileCardProps) {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const umami = useUmami();
  const shareText = t("profile-card.share-text", {
    url,
    displayName: owner.displayName,
  });

  const handlePost = async () => {
    setLoading(true);
    await fetch(`${url}/og`).catch(() => undefined);
    open(
      `https://bsky.app/intent/compose?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noreferrer",
    );
    setLoading(false);

    umami.track("click-share-link");
  };

  return (
    <Card>
      <div className="card-body gap-2">
        <div className="flex items-center">
          {owner.avatarUrl ? (
            <Avatar avatar={owner.avatarUrl} />
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
                className="btn-bluesky btn text-white"
                href={`https://bsky.app/profile/${owner.handleOrDid}`}
                target="_blank"
                rel="noreferrer"
                data-umami-event="click-bsky-link"
                data-umami-event-handle={owner.handleOrDid}
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
          <h2 className="text-xl font-bold">{owner.displayName}</h2>
          <p className="text-gray-500">{owner.displayHandle}</p>
        </div>
      </div>
    </Card>
  );
}
