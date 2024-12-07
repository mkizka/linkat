import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export function BackButton() {
  const { t } = useTranslation();
  return (
    <Link to="/" className="btn btn-ghost justify-start p-1">
      <ChevronLeftIcon className="size-6" />
      {t("back-button.text")}
    </Link>
  );
}
