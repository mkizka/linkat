import {
  Cog6ToothIcon,
  EyeIcon,
  PencilSquareIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { BlueskyIcon } from "~/components/icons/bluesky";
import { useUmami } from "~/hooks/useUmami";

type Props = {
  handle: string;
  hasBoard: boolean;
};

export function EditorMenu({ handle, hasBoard }: Props) {
  const { t } = useTranslation();
  const umami = useUmami();
  const tiles = [
    ...(hasBoard
      ? [
          {
            to: `/${handle}`,
            icon: EyeIcon,
            label: t("_index.view-board-link"),
            umamiEvent: "click-view-board-link",
          },
          {
            to: "/edit",
            icon: PencilSquareIcon,
            label: t("_index.edit-link"),
            umamiEvent: "click-edit-link",
            testId: "index__edit-link",
          },
          {
            to: "/export",
            icon: BlueskyIcon,
            label: t("_index.export-link"),
            testId: "index__export-link",
            umamiEvent: "click-export-link",
          },
        ]
      : [
          {
            to: "/edit",
            icon: PlusIcon,
            label: t("_index.create-board-link"),
            umamiEvent: "click-create-board-link",
            testId: "index__edit-link",
          },
        ]),
    {
      to: "/settings",
      icon: Cog6ToothIcon,
      label: t("_index.settings-link"),
      umamiEvent: "click-settings-link",
    },
  ];
  return (
    <nav className="grid grid-cols-2 gap-2">
      {tiles.map(({ to, icon: Icon, label, testId, umamiEvent }) => (
        <Link
          key={to}
          to={to}
          className="card items-center gap-1 bg-base-100 py-3 text-sm font-bold shadow-sm"
          data-testid={testId}
          onClick={() => umami.track(umamiEvent)}
        >
          <Icon className="size-6" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
