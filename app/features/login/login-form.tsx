import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Form, useNavigate } from "@remix-run/react";
import { type ComponentProps, useState } from "react";
import { z } from "zod";

import { useLogin } from "~/atoms/user/hooks";
import { Button } from "~/components/button";
import { Card } from "~/components/card";

import { useLastLoginService } from "./use-last-login-service";

const schema = z.object({
  service: z
    .string({ required_error: "入力してください" })
    .url("URLを入力してください"),
  identifier: z
    .string({ required_error: "入力してください" })
    .regex(/\./, "example.bsky.socialのように入力してください"),
  password: z
    .string({ required_error: "入力してください" })
    .regex(/^[a-z0-9-]+$/, "アプリパスワードしか使用できません"),
});

type Schema = z.infer<typeof schema>;

type Props = ComponentProps<"input"> & {
  label: string;
  errors?: string[];
};

function Input({ label, errors, ...props }: Props) {
  return (
    <div>
      <label className="form-control">
        <div className="label">
          <span className="label-text">{label}</span>
        </div>
        <input className="input input-bordered" {...props} />
      </label>
      {errors && <p className="p-1 text-sm text-error">{errors}</p>}
    </div>
  );
}

export function LoginForm() {
  const login = useLogin();
  const navigate = useNavigate();

  const [lastLoginService, setLastLoginService] = useLastLoginService();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, fields] = useForm({
    id: "login-form",
    constraint: getZodConstraint(schema),
    defaultValue: { service: lastLoginService },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
    onSubmit: async (event, { submission }) => {
      event.preventDefault();
      setIsSubmitting(true);
      const payload = submission?.payload as Schema;
      try {
        await login(payload);
        setLastLoginService(payload.service);
        navigate(`/edit`);
      } catch (e) {
        alert("ログインに失敗しました");
        setIsSubmitting(false);
      }
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
          {...getInputProps(fields.service, { type: "url" })}
          label="サービスURL(分かる人向け)"
          errors={fields.service.errors}
          placeholder="https://bsky.social"
          data-testid="login-form__service"
        />
        <Input
          {...getInputProps(fields.identifier, { type: "text" })}
          label="ハンドル"
          errors={fields.identifier.errors}
          placeholder="example.bsky.social"
          autoComplete="username"
          data-testid="login-form__identifier"
        />
        <Input
          {...getInputProps(fields.password, { type: "password" })}
          label="アプリパスワード"
          errors={fields.password.errors}
          placeholder="xxxx-xxxx-xxxx-xxxx"
          autoComplete="current-password"
          data-testid="login-form__password"
        />
        <Button
          type="submit"
          className="mt-4"
          loading={isSubmitting}
          data-testid="login-form__submit"
        >
          ログイン
        </Button>
      </Form>
    </Card>
  );
}