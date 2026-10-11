import { UserIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import type { User } from "~/models/user";

type BoardOwner = Pick<User, "avatar" | "displayName" | "handle">;

export function UserAvatar({ user }: { user: BoardOwner }) {
  return (
    <div className="avatar avatar-placeholder">
      <div className="w-9 rounded-full bg-neutral text-neutral-content">
        {user.avatar ? (
          <img src={user.avatar} alt="" />
        ) : (
          <UserIcon className="w-6" />
        )}
      </div>
    </div>
  );
}

export function RecentBoards({ users }: { users: BoardOwner[] }) {
  const { t } = useTranslation();
  if (users.length === 0) {
    return null;
  }
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-center text-sm font-bold text-base-content/70">
        {t("recent-boards.title")}
      </h2>
      <div className="flex justify-center gap-1.5">
        {users.map((user) => (
          <Link
            key={user.handle}
            to={`/${user.handle}`}
            title={user.displayName ?? user.handle}
            aria-label={user.displayName ?? user.handle}
            data-umami-event="click-recent-board"
          >
            <UserAvatar user={user} />
          </Link>
        ))}
      </div>
    </section>
  );
}
