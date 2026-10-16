import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Form, useNavigation } from "react-router";

import { Button } from "~/components/button";
import { Main } from "~/components/layout";
import { SelectCardList } from "~/features/board/card/select-card-list";
import { ExportBar } from "~/features/export/export-bar";
import { ExportDone } from "~/features/export/export-done";
import {
  isExportableCard,
  MAX_EXPORT_CARDS,
  type ValidCard,
} from "~/models/card";

type Props = {
  handle: string;
  cards: ValidCard[];
  exportedCards?: ValidCard[];
};

export function ExportPage({ handle, cards, exportedCards }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [selected, setSelected] = useState(() =>
    cards
      .flatMap((card, index) => (isExportableCard(card) ? [index] : []))
      .slice(0, MAX_EXPORT_CARDS),
  );
  const isExporting = navigation.formData !== undefined;

  if (exportedCards) {
    return (
      <>
        <ExportBar />
        <Main className="flex flex-col justify-center py-6">
          <ExportDone handle={handle} cards={exportedCards} />
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
            {selected.length} / {MAX_EXPORT_CARDS}
          </b>
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
