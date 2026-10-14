import { AtSymbolIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { cn } from "~/utils/cn";

export function Hero() {
  const { t, i18n } = useTranslation();
  return (
    <section className="flex flex-col items-center gap-8">
      <h2
        className={cn(
          "whitespace-pre-line text-center font-bold",
          i18n.language === "ja" ? "text-4xl" : "text-3xl",
        )}
      >
        {t("_index.hero-text")}
      </h2>
      <div className="flex flex-col items-center gap-6">
        <Link
          to="/login"
          className="btn-bluesky btn w-64 rounded-full text-blue-100"
          data-testid="index__login-link"
        >
          <AtSymbolIcon className="size-6" />
          {t("_index.login-link")}
        </Link>
        <Link to="/about" className="text-sm text-base-content/70 underline">
          {t("_index.notes-link")}
        </Link>
      </div>
    </section>
  );
}
