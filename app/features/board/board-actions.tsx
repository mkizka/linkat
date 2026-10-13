import { PencilSquareIcon, ShareIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Button } from "~/components/button";
import { BlueskyIcon } from "~/components/icons/bluesky";
import { useUmami } from "~/hooks/useUmami";
import type { OwnerView } from "~/server/service/owner/ownerView";

type Props = {
  owner: OwnerView;
  url: string;
  isMine: boolean;
};

export function BoardActions({ owner, url, isMine }: Props) {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const umami = useUmami();
  const shareText = t("board-actions.share-text", {
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
    <>
      {isMine ? (
        <Link
          className="btn btn-primary"
          to="/edit"
          data-testid="profile-card__edit"
        >
          <PencilSquareIcon className="size-6" />
          {t("board-actions.edit-button")}
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
    </>
  );
}
