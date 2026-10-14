import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Form, Link } from "react-router";

import { Button } from "~/components/button";

type Props = {
  boardJson: string;
  cardCount: number;
  isSaving: boolean;
};

export function EditBar({ boardJson, cardCount, isSaving }: Props) {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-10 mx-auto w-full max-w-screen-sm bg-base-200/90 backdrop-blur">
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2">
        <Link
          to="/"
          className="btn justify-self-start gap-1 px-3 whitespace-nowrap"
          data-testid="edit-bar__back"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {t("edit.back-to-top")}
        </Link>
        <h1 className="font-bold">{t("edit.title")}</h1>
        <Form method="post" className="justify-self-end">
          <input name="board" type="hidden" value={boardJson} />
          <Button
            className="btn-primary"
            data-testid="edit-bar__submit"
            loading={isSaving}
            data-umami-event="click-submit-button"
            data-umami-event-cards={cardCount}
          >
            {t("edit.submit-button")}
          </Button>
        </Form>
      </div>
    </header>
  );
}
