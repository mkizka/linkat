import { GlobeAltIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Form, useNavigation } from "react-router";

import { Button } from "~/components/button";

const SAMPLE_LINKS = ["GitHub", "YouTube", "Instagram"];

function ProfilePreview() {
  return (
    <div
      className="overflow-hidden rounded-lg border border-base-content/10"
      aria-hidden
    >
      <div className="h-8 bg-primary/20" />
      <div className="px-3 pb-3">
        <div className="-mt-4 size-9 rounded-full border-2 border-base-100 bg-base-300" />
        <div className="mt-1.5 h-2 w-16 rounded bg-base-content/30" />
        <div className="mt-1.5 h-1.5 w-3/4 rounded bg-base-content/15" />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SAMPLE_LINKS.map((label) => (
            <span
              key={label}
              className="flex items-center gap-1 rounded-full bg-base-200 px-2 py-0.5 text-[10px] font-bold ring-2 ring-primary"
            >
              <GlobeAltIcon className="size-3" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ExportReauth() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const isSubmitting = navigation.formData !== undefined;
  const steps = [
    t("export.reauth-step-allow"),
    t("export.reauth-step-select"),
    t("export.reauth-step-show"),
  ];
  return (
    <Form
      method="post"
      action="/login?redirect=/export&bskyLinks=1"
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="from" value="/export" />
      <div className="card gap-4 bg-base-100 px-5 py-6">
        <h2
          className="text-center text-lg font-bold"
          data-testid="export-reauth__title"
        >
          {t("export.reauth-title")}
        </h2>
        <ProfilePreview />
        <ol className="flex flex-col gap-2 text-sm">
          {steps.map((step, index) => (
            <li key={step} className="flex items-center gap-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-content">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
      <Button
        className="btn-primary"
        loading={isSubmitting}
        data-testid="export-reauth__submit"
      >
        {t("export.reauth-button")}
      </Button>
    </Form>
  );
}
