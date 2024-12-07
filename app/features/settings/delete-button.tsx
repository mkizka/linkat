import { useTranslation } from "react-i18next";
import { Form, useSubmit } from "react-router";

import { Button } from "~/components/button";

export function DeleteBoardButton() {
  const { t } = useTranslation();
  const submit = useSubmit();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ok = confirm(t("delete-board-button.confirm-message"));
    if (ok) {
      void submit(event.currentTarget);
    }
    void umami.track("handle-", {
      action: ok ? "confirm" : "cancel",
    });
  };

  return (
    <Form action="/delete" method="post" onSubmit={handleSubmit}>
      <Button
        type="submit"
        className="btn btn-error"
        data-umami-event="click-delete-board-button"
        data-testid="delete-board-button"
      >
        {t("delete-board-button.text")}
      </Button>
    </Form>
  );
}
