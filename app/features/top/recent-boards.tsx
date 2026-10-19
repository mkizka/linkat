import { UserIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import type { OwnerView } from "~/server/service/owner/ownerView";

function OwnerAvatar({ owner }: { owner: OwnerView }) {
  return (
    <div className="avatar avatar-placeholder">
      <div className="w-9 rounded-full bg-neutral text-neutral-content">
        {owner.avatarUrl ? (
          <img src={owner.avatarUrl} alt="" />
        ) : (
          <UserIcon className="w-6" />
        )}
      </div>
    </div>
  );
}

export function RecentBoards({ owners }: { owners: OwnerView[] }) {
  const { t } = useTranslation();
  if (owners.length === 0) {
    return null;
  }
  return (
    <section className="@container flex flex-col gap-4">
      <h2 className="text-center text-sm font-bold text-base-content/70">
        {t("recent-boards.title")}
      </h2>
      <div className="flex justify-center gap-1.5">
        {owners.map((owner) => (
          <Link
            key={owner.did}
            to={`/${owner.handleOrDid}`}
            className="@max-[330px]:nth-[n+7]:hidden"
            title={owner.displayName ?? owner.displayHandle ?? ""}
            aria-label={owner.displayName ?? owner.displayHandle ?? ""}
            data-umami-event="click-recent-board"
          >
            <OwnerAvatar owner={owner} />
          </Link>
        ))}
      </div>
    </section>
  );
}
