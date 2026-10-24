import { CheckIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

type Props = {
  handle: string;
};

export function ExportDone({ handle }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-5">
      <div className="card items-center gap-3 bg-base-100 px-5 py-7 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-success/15 text-success">
          <CheckIcon className="size-7" strokeWidth={2.5} />
        </span>
        <h2 className="text-lg font-bold" data-testid="export-done__title">
          {t("export.done-title")}
        </h2>
        <p className="flex gap-2 rounded-lg bg-base-200 p-3 text-start text-xs text-base-content/70">
          <InformationCircleIcon className="size-4 shrink-0" />
          {t("export.done-note")}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <a
          href={`https://bsky.app/profile/${handle}`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-primary"
          data-umami-event="click-export-done-bsky-link"
        >
          {t("export.view-on-bluesky-link")}
        </a>
        <Link to="/" className="btn">
          {t("export.back-to-top-link")}
        </Link>
      </div>
    </div>
  );
}
