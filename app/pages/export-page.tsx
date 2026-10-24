import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Form, useNavigation } from "react-router";

import { Button } from "~/components/button";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { Main } from "~/components/layout";
import { ExportDone } from "~/features/export/done/export-done";
import { ExportReauth } from "~/features/export/reauth/export-reauth";
import { isBskyLinkCard } from "~/features/export/select/bsky-link";
import { ExportBar } from "~/features/export/select/export-bar";
import { ExportNotice } from "~/features/export/select/export-notice";
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
  const [confirming, setConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const noticeRef = useRef<HTMLDialogElement>(null);
  const isExporting = navigation.formData !== undefined;

  if (needsReauth) {
    return (
      <>
        <ExportBar cancelable />
        <Main className="flex flex-col justify-center pt-6 pb-20">
          <ExportReauth />
        </Main>
      </>
    );
  }
  if (exported) {
    return (
      <>
        <ExportBar />
        <Main className="flex flex-col justify-center pt-6 pb-20">
          <ExportDone handle={handle} />
        </Main>
      </>
    );
  }
  return (
    <Form ref={formRef} method="post" className="contents">
      <input
        type="hidden"
        name="cards"
        value={JSON.stringify(selected.map((index) => cards[index]))}
      />
      <ExportBar
        cancelable
        submitButton={
          <Button
            type="button"
            className="btn-primary whitespace-nowrap"
            disabled={selected.length === 0 || isExporting}
            loading={isExporting}
            onClick={() => setConfirming(true)}
            data-testid="export__submit"
          >
            {t("export.submit-button")}
          </Button>
        }
      />
      <Main className="flex flex-col gap-4 py-4">
        <div className="flex flex-col gap-1 text-sm">
          <p className="text-base-content/70">
            {t("export.select-description")}
          </p>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="link inline-flex items-center gap-0.5 link-primary"
              onClick={() => noticeRef.current?.showModal()}
              data-testid="export__notice-link"
            >
              <InformationCircleIcon className="size-4" />
              {t("export.notice-link")}
            </button>
            <b className="text-primary" data-testid="export__count">
              {selected.length} / {MAX_LINKS}
            </b>
          </div>
        </div>
        <SelectCardList
          cards={cards}
          selected={selected}
          onChange={setSelected}
        />
      </Main>
      <ExportNotice ref={noticeRef} />
      <ConfirmDialog
        open={confirming}
        title={
          <span className="flex items-center gap-2">
            <ExclamationTriangleIcon className="size-6 text-warning" />
            {t("export.confirm-title")}
          </span>
        }
        description={t("export.confirm-description", {
          count: selected.length,
        })}
        cancelLabel={t("export.confirm-cancel")}
        confirmLabel={t("export.confirm-confirm")}
        confirmClassName="btn-primary"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          formRef.current?.requestSubmit();
        }}
      />
    </Form>
  );
}
