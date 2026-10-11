import {
  ChevronDownIcon,
  ChevronUpIcon,
  PencilSquareIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import { UserIcon } from "@heroicons/react/24/solid";
import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Button } from "~/components/button";
import { Card } from "~/components/card";
import { BlueskyIcon } from "~/components/icons/bluesky";
import { useUmami } from "~/hooks/useUmami";
import type { OwnerView } from "~/server/service/owner/ownerView";
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

type ProfileCardProps = {
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
        {owner.description && <Description text={owner.description} />}
      </div>
    </Card>
  );
}
