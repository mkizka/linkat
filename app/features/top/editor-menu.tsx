import {
  Cog6ToothIcon,
  EyeIcon,
  PencilSquareIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

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
  return (
    <nav className="flex justify-center gap-2">
      {tiles.map(({ to, icon: Icon, label, testId }) => (
        <Link
          key={to}
          to={to}
          className="card w-[calc((100%-1rem)/3)] items-center gap-1 bg-base-100 py-3 text-sm font-bold shadow-sm"
          data-testid={testId}
        >
          <Icon className="size-6" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
