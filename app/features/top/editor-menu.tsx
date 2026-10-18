import {
  Cog6ToothIcon,
  EyeIcon,
  PencilSquareIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { BlueskyIcon } from "~/components/icons/bluesky";

type Props = {
  handle: string;
  hasBoard: boolean;
};

export function EditorMenu({ handle, hasBoard }: Props) {
  const { t } = useTranslation();
  const tiles = [
    ...(hasBoard
      ? [
          {
            to: `/${handle}`,
            icon: EyeIcon,
            label: t("_index.view-board-link"),
          },
          {
            to: "/edit",
            icon: PencilSquareIcon,
            label: t("_index.edit-link"),
            testId: "index__edit-link",
          },
        ]
      : [
          {
            to: "/edit",
            icon: PlusIcon,
            label: t("_index.create-board-link"),
            testId: "index__edit-link",
          },
        ]),
    { to: "/settings", icon: Cog6ToothIcon, label: t("_index.settings-link") },
  ];
  const tileClassName = "card items-center gap-1 py-3 text-sm font-bold";
  const exportTile = (
    <div
      key="export"
      aria-disabled="true"
      className={`${tileClassName} relative border border-dashed border-base-content/30 text-base-content/40`}
      data-testid="index__export-link"
    >
      <BlueskyIcon className="size-6" />
      {t("_index.export-link")}
      <span className="absolute top-1.5 right-1.5 badge badge-ghost badge-xs">
        {t("_index.coming-soon")}
      </span>
    </div>
  );
  const links = tiles.map(({ to, icon: Icon, label, testId }) => (
    <Link
      key={to}
      to={to}
      className={`${tileClassName} bg-base-100 shadow-sm`}
      data-testid={testId}
    >
      <Icon className="size-6" />
      {label}
    </Link>
  ));
  return (
    <nav className="grid grid-cols-2 gap-2">
      {hasBoard ? [...links.slice(0, 2), exportTile, links[2]] : links}
    </nav>
  );
}
