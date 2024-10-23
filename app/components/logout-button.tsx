import { Form, useSubmit } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { Button } from "./button";

export function LogoutButton() {
  const { t } = useTranslation();
  const submit = useSubmit();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ok = confirm(t("logout-button.confirm-message"));
    if (ok) {
      submit(event.currentTarget);
    }
    void umami.track("handle-logout", {
      action: ok ? "confirm" : "cancel",
    });
  };

  return (
    <Form action="/logout" method="post" onSubmit={handleSubmit}>
      <Button
        type="submit"
        className="btn btn-error"
        data-umami-event="click-logout-button"
        data-testid="logout-button"
      >
        {t("logout-button.text")}
      </Button>
    </Form>
  );
}
