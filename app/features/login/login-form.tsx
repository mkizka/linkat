import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Form, useNavigation } from "@remix-run/react";
import { z } from "zod";

import { Button } from "~/components/button";
import { Card } from "~/components/card";
import { Input } from "~/components/input";

const schema = z.object({
  identifier: z
    .string({ required_error: "入力してください" })
    .regex(/\./, "example.bsky.socialのように入力してください"),
});

export function LoginForm() {
  const navigation = useNavigation();

  const [form, fields] = useForm({
    id: "login-form",
    constraint: getZodConstraint(schema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  return (
    <Card className="flex w-full max-w-screen-sm flex-row justify-center p-4 pb-8">
      <Form
        method="post"
        className="flex w-full max-w-sm flex-col gap-2"
        {...getFormProps(form)}
      >
        {form.errors && (
          <div id={form.errorId} className="text-error">
            {form.errors}
          </div>
        )}
        <Input
          {...getInputProps(fields.identifier, { type: "text" })}
          label="ハンドル"
          errors={fields.identifier.errors}
          placeholder="example.bsky.social"
          autoComplete="username"
          data-testid="login-form__identifier"
        />
        <Button
          type="submit"
          className="mt-4"
          loading={navigation.state !== "idle"}
          data-testid="login-form__submit"
        >
          ログイン
        </Button>
      </Form>
    </Card>
  );
}
