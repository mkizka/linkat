import {
  getFormProps,
  getInputProps,
  useFormMetadata,
} from "@conform-to/react";
import Picker from "@emoji-mart/react";
import { Form } from "@remix-run/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/button";
import { Input } from "~/components/input";

import type { CardFormPayload } from "./card-form-provider";

export function CardForm() {
  const { t } = useTranslation();
  const form = useFormMetadata<CardFormPayload>();
  const fields = form.getFieldset();
  const [isEmojipickerOpen, setIsEmojiPickerOpen] = useState(false);
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
      <Input
        {...getInputProps(fields.emoji, { type: "text" })}
        label={t("card-form.emoji-label")}
        errors={fields.emoji.errors}
        placeholder={t("card-form.text-placeholder")}
        // https://github.com/edmundhung/conform/issues/600
        key={fields.emoji.key}
        data-testid="card-form__emoji"
        onFocus={() => setIsEmojiPickerOpen(true)}
      />
      {isEmojipickerOpen && (
        <Picker
          // onClickOutside={() => setIsEmojiPickerOpen(false)}
          previewPosition="none"
          onEmojiSelect={(emoji: { native: string }) => {
            // eslint-disable-next-line no-console
            console.log(emoji);
            form.update({
              name: "emoji",
              value: emoji.native,
            });
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
      <p className="pl-1 text-end text-sm text-gray-400">
        {t("card-form.form-footer-message")}
      </p>
    </Form>
  );
}
