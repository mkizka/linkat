import {
  getFormProps,
  getInputProps,
  useFormMetadata,
} from "@conform-to/react";
import Picker from "@emoji-mart/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Form } from "@remix-run/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/button";
import { Input } from "~/components/input";
import { cn } from "~/utils/cn";

import type { CardFormPayload } from "./card-form-provider";

export function CardForm() {
  const { t } = useTranslation();
  const form = useFormMetadata<CardFormPayload>();
  const fields = form.getFieldset();
  const [isEmojipickerOpen, setIsEmojiPickerOpen] = useState(false);

  const handleResetEmoji = () => {
    form.update({ name: "emoji", value: "" });
  };

  return (
    <Form
      method="post"
      className="flex w-full flex-col gap-2"
      {...getFormProps(form)}
    >
      {form.errors && (
        <p id={form.errorId} className="pl-1 text-error">
          {form.errors}
        </p>
      )}
      <Input
        {...getInputProps(fields.url, { type: "url" })}
        label="URL"
        errors={fields.url.errors}
        placeholder="https://example.com"
        // https://github.com/edmundhung/conform/issues/600
        key={fields.url.key}
        data-testid="card-form__url"
      />
      <Input
        {...getInputProps(fields.text, { type: "text" })}
        label={t("card-form.text-label")}
        errors={fields.text.errors}
        placeholder={t("card-form.text-placeholder")}
        // https://github.com/edmundhung/conform/issues/600
        key={fields.text.key}
        data-testid="card-form__text"
      />
      <p className="text-sm text-gray-400">
        {t("card-form.help-input-message")}
      </p>
      <div>
        <label className="form-control">
          <div className="label">
            <span className="label-text">{t("card-form.emoji-label")}</span>
          </div>
          <input
            {...getInputProps(fields.emoji, { type: "hidden" })}
            key={fields.emoji.key}
          />
        </label>
        <div className="flex gap-2">
          <Button
            type="button"
            className={cn("w-fit", {
              "text-xl": !!fields.emoji.value,
            })}
            onClick={() => setIsEmojiPickerOpen(true)}
            data-umami-event="click-emoji-picker-button"
          >
            {fields.emoji.value ?? t("card-form.emoji-select-button")}
          </Button>
          {fields.emoji.value && (
            <Button
              type="button"
              onClick={handleResetEmoji}
              data-umami-event="click-reset-emoji-button"
            >
              <XMarkIcon className="size-6 text-error" />
              {t("card-form.emoji-reset-button")}
            </Button>
          )}
        </div>
        {fields.emoji.errors && (
          <p className="p-1 text-sm text-error">{fields.emoji.errors}</p>
        )}
      </div>
      <p className="text-sm text-gray-400">
        {t("card-form.help-emoji-message")}
      </p>
      {isEmojipickerOpen && (
        <Picker
          dynamicWidth
          onClickOutside={() => setIsEmojiPickerOpen(false)}
          previewPosition="none"
          skinTonePosition="none"
          onEmojiSelect={(emoji: { native: string }) => {
            form.update({ name: "emoji", value: emoji.native });
          }}
        />
      )}
      <input
        {...getInputProps(fields.id, { type: "hidden" })}
        key={fields.id.key}
      />
      <div className="mt-2 flex flex-col gap-2">
        <Button
          type="submit"
          name="action"
          value="save"
          className="btn-neutral"
          data-testid="card-form__submit"
        >
          {fields.id.value
            ? t("card-form.change-button")
            : t("card-form.add-button")}
        </Button>
        {fields.id.value && (
          <Button
            type="submit"
            name="action"
            value="delete"
            className="btn-error"
            data-testid="card-form__delete"
          >
            {t("card-form.delete-button")}
          </Button>
        )}
      </div>
    </Form>
  );
}
