import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Form, useNavigation } from "react-router";

import { Button } from "~/components/button";
import { Main } from "~/components/layout";
import { ExportDone } from "~/features/export/done/export-done";
import { ExportReauth } from "~/features/export/reauth/export-reauth";
import { isBskyLinkCard } from "~/features/export/select/bsky-link";
import { ExportBar } from "~/features/export/select/export-bar";
import { SelectCardList } from "~/features/export/select/select-card-list";
import type { BoardCard } from "~/schemas/board";

const MAX_LINKS = 10;

type Props = {
  handle: string;
  cards: BoardCard[];
  needsReauth?: boolean;
  exported?: boolean;
};

export function ExportPage({ handle, cards, needsReauth, exported }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [selected, setSelected] = useState(() =>
    cards
      .flatMap((card, index) => (isBskyLinkCard(card) ? [index] : []))
      .slice(0, MAX_LINKS),
  );
  const isExporting = navigation.formData !== undefined;

  if (needsReauth) {
    return (
      <>
        <ExportBar cancelable />
        <Main className="flex flex-col justify-center py-6">
          <ExportReauth />
        </Main>
      </>
    );
  }
  if (exported) {
    return (
      <>
        <ExportBar />
        <Main className="flex flex-col justify-center py-6">
          <ExportDone handle={handle} />
        </Main>
      </>
    );
  }
  return (
    <Form method="post" className="contents">
      {selected.map((index) => (
        <input key={index} type="hidden" name="index" value={index} />
      ))}
      <ExportBar
        cancelable
        submitButton={
          <Button
            className="btn-primary"
            disabled={selected.length === 0 || isExporting}
            loading={isExporting}
            data-testid="export__submit"
          >
            {t("export.submit-button")}
          </Button>
        }
      />
      <Main className="flex flex-col gap-2 py-4">
        <div className="flex items-baseline gap-2 text-sm">
          <p className="flex-1 text-base-content/70">
            {t("export.select-description")}
          </p>
          <b className="text-primary" data-testid="export__count">
            {selected.length} / {MAX_LINKS}
          </b>
        </div>
        <div
          role="note"
          className="alert alert-warning my-2 flex flex-col items-start gap-1 text-start text-sm"
          data-testid="export__replace-warning"
        >
          <p className="flex items-center gap-1 font-bold">
            <ExclamationTriangleIcon className="size-5" />
            {t("export.replace-warning-title")}
          </p>
          <p>{t("export.replace-warning")}</p>
        </div>
        <SelectCardList
          cards={cards}
          selected={selected}
          onChange={setSelected}
        />
        <p className="text-xs text-base-content/70">
          {t("export.unselectable-note")}
        </p>
      </Main>
    </Form>
  );
}
