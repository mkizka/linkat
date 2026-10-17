import { LockClosedIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Form, useNavigation } from "react-router";

import { Button } from "~/components/button";

export function ExportReauth() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const isSubmitting = navigation.formAction === "/export/reauth";
  return (
    <Form method="post" action="/export/reauth" className="flex flex-col gap-4">
      <div className="card items-center gap-3 bg-base-100 px-5 py-7 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
          <LockClosedIcon className="size-7" />
        </span>
        <h2 className="text-lg font-bold" data-testid="export-reauth__title">
          {t("export.reauth-title")}
        </h2>
        <p className="text-sm text-base-content/70">
          {t("export.reauth-description")}
        </p>
      </div>
      <Button className="btn-primary" loading={isSubmitting}>
        {t("export.reauth-button")}
      </Button>
    </Form>
  );
}
