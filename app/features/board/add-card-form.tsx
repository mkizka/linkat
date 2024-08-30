import {
  getFormProps,
  getInputProps,
  useFormMetadata,
} from "@conform-to/react";
import { Form } from "@remix-run/react";

import { Button } from "~/components/button";
import { Input } from "~/components/input";

import type { AddCardFormSchema } from "./add-card-form-provider";

export function AddCardForm() {
  const form = useFormMetadata<AddCardFormSchema>();
  const fields = form.getFieldset();
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
        {...getInputProps(fields.text, { type: "text" })}
        label="テキスト"
        errors={fields.text.errors}
        placeholder="カードに表示される文字"
        // https://github.com/edmundhung/conform/issues/600
        key={fields.text.key}
        data-testid="add-card-form__text"
      />
      <Input
        {...getInputProps(fields.url, { type: "url" })}
        label="URL"
        errors={fields.url.errors}
        placeholder="https://example.com"
        // https://github.com/edmundhung/conform/issues/600
        key={fields.url.key}
        data-testid="add-card-form__url"
      />
      <Button
        type="submit"
        className="mt-4"
        data-testid="add-card-form__submit"
      >
        追加
      </Button>
      <p className="pl-1 text-end text-sm text-gray-400">
        URLかテキストはどちらか空欄でもOKです
      </p>
    </Form>
  );
}
