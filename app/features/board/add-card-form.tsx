import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Form } from "@remix-run/react";
import { useState } from "react";
import { z } from "zod";

import { Button } from "~/components/button";
import { Input } from "~/components/input";

const schema = z
  .object({
    text: z.string().optional(),
    url: z.string().url().optional(),
  })
  .refine((value) => value.text || value.url, {
    message: "どちらかは入力してください",
  });

type Schema = z.infer<typeof schema>;

export type AddCardProps = {
  onSubmit: (payload: Schema) => void;
};

export function AddCardForm({ onSubmit }: AddCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, fields] = useForm({
    id: "add-card-form",
    constraint: getZodConstraint(schema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
    onSubmit: (event, { submission }) => {
      // prepare
      event.preventDefault();
      setIsSubmitting(true);

      // submit
      const payload = submission?.payload as Schema;
      onSubmit(payload);

      // cleanup
      (event.target as HTMLFormElement).reset();
      setIsSubmitting(false);
    },
  });

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
        placeholder="リンクカードのテキスト"
        // https://github.com/edmundhung/conform/issues/600
        key={fields.text.key}
      />
      <Input
        {...getInputProps(fields.url, { type: "url" })}
        label="URL"
        errors={fields.url.errors}
        placeholder="https://example.com"
        // https://github.com/edmundhung/conform/issues/600
        key={fields.url.key}
      />
      <Button
        type="submit"
        className="mt-4"
        loading={isSubmitting}
        data-testid="login-form__submit"
      >
        カードを追加
      </Button>
      <p className="pl-1 text-end text-sm text-gray-400">
        URLかテキストはどちらか空欄でもOKです
      </p>
    </Form>
  );
}
