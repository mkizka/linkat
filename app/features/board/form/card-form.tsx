import {
  getFormProps,
  getInputProps,
  useFormMetadata,
} from "@conform-to/react";
import { Form } from "@remix-run/react";

import { Button } from "~/components/button";
import { Input } from "~/components/input";

import type { CardFormPayload } from "./card-form-provider";

export function CardForm() {
  const form = useFormMetadata<CardFormPayload>();
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
        data-testid="card-form__text"
        autoFocus
      />
      <Input
        {...getInputProps(fields.url, { type: "url" })}
        label="URL"
        errors={fields.url.errors}
        placeholder="https://example.com"
        // https://github.com/edmundhung/conform/issues/600
        key={fields.url.key}
        data-testid="card-form__url"
      />
      <input
        {...getInputProps(fields.id, { type: "hidden" })}
        key={fields.id.key}
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          name="action"
          value="save"
          className="flex-1"
          data-testid="card-form__submit"
        >
          {fields.id.value ? "変更を保存" : "追加"}
        </Button>
        {fields.id.value && (
          <Button
            type="submit"
            name="action"
            value="delete"
            className="btn-error w-24"
            data-testid="card-form__delete"
          >
            削除
          </Button>
        )}
      </div>
      <p className="pl-1 text-end text-sm text-gray-400">
        URLかテキストはどちらか空欄でもOKです
      </p>
    </Form>
  );
}
