import { type Did, isDid } from "@atproto/did";
import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";
import type { Ref } from "react";
import { useTranslation } from "react-i18next";
import { useFetcher } from "react-router";
import { z } from "zod";

import { Button } from "~/components/button";
import type { ModerationLevelDto } from "~/server/infrastructure/moderation/moderationDto";
import { cn } from "~/utils/cn";

export const moderationFormSchema = z.object({
  ownerDid: z.custom<Did>((val) => typeof val === "string" && isDid(val)),
  level: z.enum(["none", "unlisted", "hidden"]),
});

const options = [
  { value: "none", label: "moderation.level-none" },
  { value: "unlisted", label: "moderation.level-unlisted" },
  { value: "hidden", label: "moderation.level-hidden" },
] as const;

export function ModerationBanner({
  level,
  onChange,
}: {
  level: ModerationLevelDto;
  onChange: () => void;
}) {
  const { t } = useTranslation();
  if (level === "none") {
    return null;
  }
  return (
    <div
      role="alert"
      className={cn(
        "alert flex justify-between text-start",
        level === "hidden" ? "alert-error" : "alert-warning",
      )}
      data-testid="moderation-banner"
    >
      <span>{t(`moderation.banner-${level}`)}</span>
      <button className="btn btn-ghost btn-sm" onClick={onChange}>
        {t("moderation.change-button")}
      </button>
    </div>
  );
}

export function ModerationDialog({
  ref,
  ownerDid,
  level,
}: {
  ref: Ref<HTMLDialogElement>;
  ownerDid: string;
  level: ModerationLevelDto;
}) {
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const [form, fields] = useForm({
    id: "moderation-form",
    defaultValue: { ownerDid, level },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: moderationFormSchema });
    },
    onSubmit(event) {
      event.currentTarget.closest("dialog")?.close();
    },
  });

  return (
    <dialog className="modal" ref={ref}>
      <div className="modal-box">
        <fetcher.Form
          method="post"
          action="/moderation"
          className="flex flex-col gap-2"
          {...getFormProps(form)}
        >
          <h3 className="text-lg font-bold">{t("moderation.title")}</h3>
          <input {...getInputProps(fields.ownerDid, { type: "hidden" })} />
          {options.map((option) => (
            <label
              key={option.value}
              className="label cursor-pointer justify-start gap-2"
            >
              <input
                {...getInputProps(fields.level, {
                  type: "radio",
                  value: option.value,
                })}
                className="radio"
              />
              <span>{t(option.label)}</span>
            </label>
          ))}
          <Button
            className="btn-primary mt-2"
            loading={fetcher.state !== "idle"}
          >
            {t("moderation.save-button")}
          </Button>
        </fetcher.Form>
        <form method="dialog">
          <button className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2">
            ✕
          </button>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
