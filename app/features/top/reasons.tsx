import {
  AtSymbolIcon,
  ChatBubbleBottomCenterTextIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

export function Reasons() {
  const { t } = useTranslation();
  const reasons = [
    { icon: AtSymbolIcon, text: t("_index.reason-bluesky-account") },
    { icon: ChatBubbleBottomCenterTextIcon, text: t("_index.reason-embed") },
    { icon: LockClosedIcon, text: t("_index.reason-your-data") },
  ];
  return (
    <ul className="grid grid-cols-3 divide-x divide-base-300 rounded-box bg-base-100 px-2 py-4 text-center text-xs font-bold">
      {reasons.map(({ icon: Icon, text }) => (
        <li key={text} className="flex flex-col items-center gap-2 px-2">
          <Icon className="size-6 text-blue-500" />
          <span className="whitespace-pre-line">{text}</span>
        </li>
      ))}
    </ul>
  );
}
