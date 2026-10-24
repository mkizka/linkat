import {
  ArrowUpRightIcon,
  GlobeAltIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Form, useNavigation } from "react-router";

import { Button } from "~/components/button";

function ProfilePreview() {
  const { t } = useTranslation();
  const sampleLinks = [t("export.reauth-sample-blog"), "YouTube", "Instagram"];
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
          {sampleLinks.map((label) => (
            <span
              key={label}
              className="flex items-center gap-1 rounded-full bg-base-200 px-2 py-1 text-[10px] font-bold"
            >
              <GlobeAltIcon className="size-3" />
              {label}
              <ArrowUpRightIcon className="size-2.5" strokeWidth={2.5} />
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
  return (
    <Form
      method="post"
      action="/login?redirect=/export&bskyLinks=1"
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="from" value="/export" />
      <div className="card gap-4 bg-base-100 px-5 py-6">
        <h2
          className="text-center text-lg font-bold whitespace-pre-line"
          data-testid="export-reauth__title"
        >
          {t("export.reauth-title")}
        </h2>
        <div className="flex flex-col gap-1.5">
          <ProfilePreview />
          <p className="text-xs text-base-content/60">
            {t("export.reauth-icon-note")}
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-lg bg-base-200 p-3">
          <LockClosedIcon className="size-5 shrink-0 text-primary" />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-bold">
              {t("export.reauth-permission-title")}
            </p>
            <p className="text-xs text-base-content/70">
              {t("export.reauth-permission-description")}
            </p>
          </div>
        </div>
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
