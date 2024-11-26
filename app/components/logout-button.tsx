import { useTranslation } from "react-i18next";
import { Form, useSubmit } from "react-router";

import { Button } from "./button";

export function LogoutButton() {
  const { t } = useTranslation();
  const submit = useSubmit();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ok = confirm(t("logout-button.confirm-message"));
    if (ok) {
      void submit(event.currentTarget);
    }
    void umami.track("handle-logout", {
      action: ok ? "confirm" : "cancel",
    });
  };

  return (
    <Form action="/logout" method="post" onSubmit={handleSubmit}>
      <Button
        type="submit"
        className="btn btn-ghost btn-sm w-64 text-error"
        data-umami-event="click-logout-button"
        data-testid="logout-button"
      >
        {t("logout-button.text")}
      </Button>
    </Form>
  );
}
