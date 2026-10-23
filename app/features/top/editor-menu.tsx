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
  experimental: boolean;
};

export function EditorMenu({ handle, hasBoard, experimental }: Props) {
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
          {
            to: "/export",
            icon: BlueskyIcon,
            label: t("_index.export-link"),
            testId: "index__export-link",
            disabled: !experimental,
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
  return (
    <nav className="grid grid-cols-2 gap-2">
      {tiles.map(({ to, icon: Icon, label, testId, disabled }) =>
        disabled ? (
          <div
            key={to}
            aria-disabled="true"
            className={`${tileClassName} border border-dashed border-base-content/30 text-base-content/40`}
            data-testid={testId}
          >
            <Icon className="size-6" />
            {label}
            <span className="absolute top-1.5 right-1.5 badge badge-ghost badge-xs">
              {t("_index.preparing")}
            </span>
          </div>
        ) : (
          <Link
            key={to}
            to={to}
            className={`${tileClassName} bg-base-100 shadow-sm`}
            data-testid={testId}
          >
            <Icon className="size-6" />
            {label}
          </Link>
        ),
      )}
    </nav>
  );
}
