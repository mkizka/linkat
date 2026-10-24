import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

type Props = {
  cancelable?: boolean;
  submitButton?: ReactNode;
};

export function ExportBar({ cancelable, submitButton }: Props) {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-10 mx-auto w-full max-w-screen-sm bg-base-200/90 backdrop-blur">
      <div className="grid min-h-14 w-full grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2">
        {cancelable ? (
          <Link
            to="/"
            className="btn justify-self-start px-3 whitespace-nowrap"
          >
            {t("export.cancel-button")}
          </Link>
        ) : (
          <span />
        )}
        <h1 className="text-sm font-bold">{t("export.title")}</h1>
        <div className="justify-self-end">{submitButton}</div>
      </div>
    </header>
  );
}
