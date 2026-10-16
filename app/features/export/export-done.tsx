import { CheckIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import type { ValidCard } from "~/models/card";

type Props = {
  handle: string;
  cards: ValidCard[];
};

export function ExportDone({ handle, cards }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-5">
      <div className="card items-center gap-3 bg-base-100 px-5 py-7 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-success/15 text-success">
          <CheckIcon className="size-7" strokeWidth={2.5} />
        </span>
        <h2 className="text-lg font-bold" data-testid="export-done__title">
          {t("export.done-title", { count: cards.length })}
        </h2>
        <p className="text-sm text-base-content/70">
          {t("export.done-description")}
        </p>
        <ul className="flex flex-wrap justify-center gap-1.5 pt-1">
          {cards.map((card, index) => (
            <li key={index} className="badge border-none bg-base-200 font-bold">
              {card.text || card.url}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-2">
        <a
          href={`https://bsky.app/profile/${handle}`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-primary"
        >
          {t("export.view-on-bluesky-link")}
        </a>
        <Link to="/" className="btn">
          {t("export.back-to-top-link")}
        </Link>
      </div>
      <p className="text-center text-xs text-base-content/70">
        {t("export.done-note")}
      </p>
    </div>
  );
}
